import { Buffer } from 'node:buffer'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

initializeApp()

const database = getFirestore()
const twilioAccountSid = defineSecret('TWILIO_ACCOUNT_SID')
const twilioAuthToken = defineSecret('TWILIO_AUTH_TOKEN')
const twilioFromNumber = defineSecret('TWILIO_FROM_NUMBER')

function normalizeBarangay(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\bbrgy\.?\b/g, 'barangay')
    .replace(/\s+/g, ' ')
}

function normalizePhone(value) {
  let phone = String(value || '').replace(/[\s()-]/g, '')
  if (/^09\d{9}$/.test(phone)) phone = `+63${phone.slice(1)}`
  else if (/^639\d{9}$/.test(phone)) phone = `+${phone}`
  return /^\+639\d{9}$/.test(phone) ? phone : ''
}

async function getRecipients(announcement) {
  const role = announcement.audience === 'staff' ? 'staff' : 'user'
  const profileSnapshot = await database.collection('users').where('role', '==', role).get()
  const targetBarangay = normalizeBarangay(announcement.barangay)
  const profiles = profileSnapshot.docs
    .map((profileDocument) => profileDocument.data())
    .filter((profile) => {
      if (announcement.audience === 'evacuees' && profile.status !== 'Active') return false
      return announcement.audience !== 'barangay' || normalizeBarangay(profile.barangay) === targetBarangay
    })

  const phones = new Set()
  let missingPhoneCount = 0
  let duplicatePhoneCount = 0
  for (const profile of profiles) {
    const phone = normalizePhone(profile.phone)
    if (!phone) {
      missingPhoneCount += 1
    } else if (phones.has(phone)) {
      duplicatePhoneCount += 1
    } else {
      phones.add(phone)
    }
  }

  return {
    phones: [...phones],
    matchingProfileCount: profiles.length,
    missingPhoneCount,
    duplicatePhoneCount,
  }
}

async function sendSms(phone, body) {
  const accountSid = twilioAccountSid.value()
  const authToken = twilioAuthToken.value()
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const form = new URLSearchParams({ To: phone, From: twilioFromNumber.value(), Body: body })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form,
  })

  if (!response.ok) {
    const providerError = await response.json().catch(() => ({}))
    throw new Error(`Twilio returned HTTP ${response.status}${providerError.code ? ` (code ${providerError.code})` : ''}.`)
  }
}

async function sendToRecipients(phones, body) {
  let nextIndex = 0
  const failures = []
  let acceptedCount = 0
  const worker = async () => {
    while (nextIndex < phones.length) {
      const phone = phones[nextIndex]
      nextIndex += 1
      try {
        await sendSms(phone, body)
        acceptedCount += 1
      } catch (error) {
        failures.push(error.message)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, phones.length) }, () => worker()))
  return { acceptedCount, failures }
}

export const sendSmsAnnouncement = onDocumentCreated({
  document: 'announcements/{announcementId}',
  secrets: [twilioAccountSid, twilioAuthToken, twilioFromNumber],
  timeoutSeconds: 540,
  memory: '512MiB',
}, async (event) => {
  const announcementSnapshot = event.data
  if (!announcementSnapshot) return
  const announcement = announcementSnapshot.data()
  if (announcement.channel !== 'sms') return

  const announcementRef = announcementSnapshot.ref
  const claimed = await database.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(announcementRef)
    if (!currentSnapshot.exists() || currentSnapshot.data().smsDelivery) return false
    transaction.update(announcementRef, {
      smsDelivery: { status: 'sending' },
      smsDeliveryUpdatedAt: FieldValue.serverTimestamp(),
    })
    return true
  })
  if (!claimed) return

  try {
    const authorSnapshot = await database.collection('users').doc(announcement.authorUid).get()
    const author = authorSnapshot.data()
    if (!author || !['admin', 'staff'].includes(author.role)) {
      throw new Error('The sender is not authorized to send alerts.')
    }
    if (announcement.audience === 'barangay' && author.role === 'staff' &&
      normalizeBarangay(author.barangay) !== normalizeBarangay(announcement.barangay)) {
      throw new Error('Staff may only send alerts to their assigned barangay.')
    }

    const body = `${announcement.title}\n${announcement.message}`.trim()
    if (body.length > 1600) throw new Error('SMS title and message exceed the 1,600 character limit.')

    const recipients = await getRecipients(announcement)
    if (!recipients.phones.length) {
      await announcementRef.update({
        smsDelivery: {
          status: 'no_recipients',
          recipientCount: 0,
          acceptedCount: 0,
          failedCount: 0,
          missingPhoneCount: recipients.missingPhoneCount,
          duplicatePhoneCount: recipients.duplicatePhoneCount,
          errorSummary: 'No matching recipients have a valid saved phone number.',
        },
        smsDeliveryUpdatedAt: FieldValue.serverTimestamp(),
      })
      return
    }

    const result = await sendToRecipients(recipients.phones, body)
    const failedCount = recipients.phones.length - result.acceptedCount
    const status = failedCount === 0 ? 'sent' : result.acceptedCount > 0 ? 'partial' : 'failed'
    const failureSummary = [...new Set(result.failures)].slice(0, 3).join(' ')
    await announcementRef.update({
      smsDelivery: {
        status,
        matchingProfileCount: recipients.matchingProfileCount,
        recipientCount: recipients.phones.length,
        acceptedCount: result.acceptedCount,
        failedCount,
        missingPhoneCount: recipients.missingPhoneCount,
        duplicatePhoneCount: recipients.duplicatePhoneCount,
        ...(failureSummary ? { errorSummary: failureSummary } : {}),
      },
      smsDeliveryUpdatedAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    logger.error('SMS announcement processing failed.', { announcementId: event.params.announcementId, error: error.message })
    await announcementRef.update({
      smsDelivery: {
        status: 'failed',
        recipientCount: 0,
        acceptedCount: 0,
        failedCount: 0,
        errorSummary: error.message,
      },
      smsDeliveryUpdatedAt: FieldValue.serverTimestamp(),
    })
  }
})