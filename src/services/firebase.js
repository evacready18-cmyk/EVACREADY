// Import the functions you need from the SDKs you need
import { initializeApp, deleteApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKHpTCE-Z_61t2wYZWfi0iGuB00nrz7NE",
  authDomain: "evacready.firebaseapp.com",
  projectId: "evacready",
  storageBucket: "evacready.firebasestorage.app",
  messagingSenderId: "279856673348",
  appId: "1:279856673348:web:8543720d8e673260124211",
  measurementId: "G-GHPV6BGPXW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { db };

export async function syncUserProfile(user, extraData = {}, firestoreInstance = db) {
  const userDocRef = doc(firestoreInstance, "users", user.uid)
  const userSnapshot = await getDoc(userDocRef)

  const profile = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || extraData.name || "",
    role: extraData.role || "user",
    barangay: extraData.barangay || "",
    phone: extraData.phone || "",
    status: extraData.status || (userSnapshot.exists() ? userSnapshot.data().status || "Inactive" : "Inactive"),
    provider: extraData.provider || "email",
    updatedAt: serverTimestamp(),
    ...(extraData.idPhotoUrl ? { idPhotoUrl: extraData.idPhotoUrl } : {}),
    ...(userSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
  }

  await setDoc(userDocRef, profile, { merge: true })
  return profile
}

export async function registerWithEmailPassword({ email, password, name, role = "user", barangay = "", phone = "", idPhotoUrl = "" }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  await syncUserProfile(credential.user, { name, role, barangay, phone, idPhotoUrl, provider: "email" })
  return credential.user
}

// Creates a Firebase Auth account for a staff member using a temporary secondary
// app instance so the admin's own signed-in session is not replaced in the process.
export async function createStaffAccount({ email, password, name, barangay = "" }) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await updateProfile(credential.user, { displayName: name })
    // The primary session remains the authenticated admin, which authorizes creation
    // of the staff profile without allowing residents to assign themselves this role.
    await syncUserProfile(credential.user, { name, role: "staff", barangay, provider: "email" })
    return credential.user
  } finally {
    await signOut(secondaryAuth)
    await deleteApp(secondaryApp)
  }
}

export async function signInWithEmailPassword(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOutUser() {
  await signOut(auth)
}

export async function setCurrentStaffStatus(status) {
  const user = auth.currentUser
  if (!user) return
  const profile = await getUserProfile(user.uid)
  if (profile?.role === "staff") {
    await updateDoc(doc(db, "users", user.uid), { status, updatedAt: serverTimestamp() })
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, provider)
  const user = credential.user

  await syncUserProfile(user, {
    name: user.displayName || "",
    role: "user",
    provider: "google",
  })

  return user
}

export function getCurrentUser() {
  return auth.currentUser
}

export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback)
}

export async function createDocument(collectionName, data) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });

  return docRef;
}

export async function createUserProfile(userData) {
  const docRef = await addDoc(collection(db, "users"), {
    ...userData,
    createdAt: serverTimestamp(),
  });

  return docRef;
}

export async function createEvacuationCenter({ name, barangay, location, coords = "", capacity, imageUrl = "" }) {
  const centerCapacity = Number(capacity)
  if (!Number.isInteger(centerCapacity) || centerCapacity < 1) {
    throw new Error("Capacity must be a whole number greater than zero.")
  }

  return addDoc(collection(db, "evacuationCenters"), {
    name: name.trim(),
    barangay: barangay.trim(),
    location: location.trim(),
    coords: coords.trim(),
    capacity: centerCapacity,
    availableSlots: centerCapacity,
    lastCheckInResidentUid: "",
    imageUrl: imageUrl.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToEvacuationCenters(callback) {
  return onSnapshot(collection(db, "evacuationCenters"), (snapshot) => {
    callback(snapshot.docs.map((centerDoc) => ({ id: centerDoc.id, ...centerDoc.data() })))
  }, (error) => {
    console.error("Error subscribing to evacuation centers:", error)
    callback([])
  })
}

export async function deleteEvacuationCenter(centerId) {
  await deleteDoc(doc(db, "evacuationCenters", centerId))
}

export async function checkIntoEvacuationCenter(centerId, residentUid) {
  const centerRef = doc(db, "evacuationCenters", centerId)
  const checkInRef = doc(db, "evacuationCenters", centerId, "checkIns", residentUid)
  const residentRef = doc(db, "users", residentUid)
  const evacueeRef = doc(db, "evacuees", residentUid)
  const historyRef = doc(collection(db, "evacueeHistory"))

  const visit = await runTransaction(db, async (transaction) => {
    const [centerSnapshot, checkInSnapshot, residentSnapshot] = await Promise.all([
      transaction.get(centerRef),
      transaction.get(checkInRef),
      transaction.get(residentRef),
    ])

    if (!centerSnapshot.exists()) throw new Error("This evacuation center is no longer available.")
    if (checkInSnapshot.exists()) throw new Error("You have already checked in at this evacuation center.")
    if (!residentSnapshot.exists()) throw new Error("Your resident profile is unavailable.")

    const availableSlots = Number(centerSnapshot.data().availableSlots)
    if (!Number.isInteger(availableSlots) || availableSlots < 1) {
      throw new Error("This evacuation center is full.")
    }

    transaction.set(checkInRef, {
      residentUid,
      residentName: residentSnapshot.data().name || "Resident",
      phone: residentSnapshot.data().phone || "",
      barangay: residentSnapshot.data().barangay || "",
      barangayKey: normalizeBarangay(residentSnapshot.data().barangay),
      centerName: centerSnapshot.data().name || "Evacuation Center",
      historyId: historyRef.id,
      checkedInAt: serverTimestamp(),
    })
    transaction.update(centerRef, {
      availableSlots: availableSlots - 1,
      lastCheckInResidentUid: residentUid,
      updatedAt: serverTimestamp(),
    })

    return {
      residentUid,
      residentName: residentSnapshot.data().name || "Resident",
      phone: residentSnapshot.data().phone || "",
      barangay: residentSnapshot.data().barangay || "",
      barangayKey: normalizeBarangay(residentSnapshot.data().barangay),
      centerId,
      centerName: centerSnapshot.data().name || "Evacuation Center",
    }
  })

  await setDoc(evacueeRef, {
    ...visit,
    status: "Active",
    checkedInAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await setDoc(historyRef, {
    ...visit,
    status: "Active",
    checkedInAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function activateResidentAtCenter(centerId, residentUid) {
  const residentRef = doc(db, "users", residentUid)
  const residentSnapshot = await getDoc(residentRef)
  if (!residentSnapshot.exists() || residentSnapshot.data().role !== "user") {
    throw new Error("This resident profile is unavailable.")
  }

  const previousStatus = residentSnapshot.data().status || "Inactive"
  const previousCenterId = residentSnapshot.data().evacuationCenterId || ""
  const selectedCenterCheckInRef = doc(db, "evacuationCenters", centerId, "checkIns", residentUid)
  const selectedCenterCheckIn = await getDoc(selectedCenterCheckInRef)
  if (selectedCenterCheckIn.exists()) {
    await updateDoc(residentRef, { status: "Active", evacuationCenterId: centerId, updatedAt: serverTimestamp() })
    return
  }

  const existingCheckInRef = previousCenterId
    ? doc(db, "evacuationCenters", previousCenterId, "checkIns", residentUid)
    : null
  const existingCheckIn = existingCheckInRef ? await getDoc(existingCheckInRef) : null

  if (existingCheckIn?.exists()) {
    await updateDoc(residentRef, { status: "Active", updatedAt: serverTimestamp() })
    return
  }

  await updateDoc(residentRef, { status: "Active", evacuationCenterId: centerId, updatedAt: serverTimestamp() })
  try {
    await checkIntoEvacuationCenter(centerId, residentUid)
  } catch (error) {
    await updateDoc(residentRef, { status: previousStatus, evacuationCenterId: previousCenterId, updatedAt: serverTimestamp() })
    throw error
  }
}

export async function deactivateResidentFromCenter(residentUid) {
  const residentRef = doc(db, "users", residentUid)
  const residentSnapshot = await getDoc(residentRef)
  if (!residentSnapshot.exists()) throw new Error("This resident profile is unavailable.")

  const centerId = residentSnapshot.data().evacuationCenterId || ""
  if (!centerId) {
    const resident = residentSnapshot.data()
    const checkoutRecord = {
      residentUid,
      residentName: resident.name || "Resident",
      phone: resident.phone || "",
      barangay: resident.barangay || "",
      barangayKey: normalizeBarangay(resident.barangay),
      centerId: "",
      centerName: "Not recorded",
      status: "Checked out",
      checkedOutAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(doc(db, "evacuees", residentUid), checkoutRecord, { merge: true })
    await setDoc(doc(collection(db, "evacueeHistory")), checkoutRecord)
    await updateDoc(residentRef, { status: "Inactive", updatedAt: serverTimestamp() })
    return
  }

  const centerRef = doc(db, "evacuationCenters", centerId)
  const checkInRef = doc(db, "evacuationCenters", centerId, "checkIns", residentUid)
  const evacueeRef = doc(db, "evacuees", residentUid)
  const activeCheckInSnapshot = await getDoc(checkInRef)
  if (!activeCheckInSnapshot.exists()) {
    await updateDoc(residentRef, { status: "Inactive", updatedAt: serverTimestamp() })
    return
  }

  await updateDoc(residentRef, { status: "Inactive", updatedAt: serverTimestamp() })
  const checkout = await runTransaction(db, async (transaction) => {
    const [centerSnapshot, checkInSnapshot] = await Promise.all([
      transaction.get(centerRef),
      transaction.get(checkInRef),
    ])
    if (!centerSnapshot.exists() || !checkInSnapshot.exists()) {
      throw new Error("The resident's active evacuation-center assignment was not found.")
    }

    const capacity = Number(centerSnapshot.data().capacity)
    const availableSlots = Number(centerSnapshot.data().availableSlots)
    if (!Number.isInteger(capacity) || !Number.isInteger(availableSlots) || availableSlots >= capacity) {
      throw new Error("The evacuation center availability cannot be restored.")
    }

    transaction.delete(checkInRef)
    transaction.update(centerRef, {
      availableSlots: availableSlots + 1,
      lastCheckInResidentUid: residentUid,
      updatedAt: serverTimestamp(),
    })

    return {
      residentUid,
      residentName: checkInSnapshot.data().residentName || "Resident",
      phone: checkInSnapshot.data().phone || "",
      barangay: checkInSnapshot.data().barangay || "",
      barangayKey: checkInSnapshot.data().barangayKey || normalizeBarangay(checkInSnapshot.data().barangay),
      centerId,
      centerName: checkInSnapshot.data().centerName || "Evacuation Center",
      historyId: checkInSnapshot.data().historyId || "",
    }
  })

  const checkoutRecord = {
    ...checkout,
    status: "Checked out",
    checkedOutAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(evacueeRef, checkoutRecord, { merge: true })
  if (checkout.historyId) {
    await updateDoc(doc(db, "evacueeHistory", checkout.historyId), checkoutRecord)
  } else {
    await setDoc(doc(collection(db, "evacueeHistory")), checkoutRecord)
  }
}

export function subscribeToActiveEvacuees({ barangay = "" } = {}, callback) {
  const normalizedBarangay = normalizeBarangay(barangay)
  const evacuees = collection(db, "evacuees")
  const checkInQuery = normalizedBarangay
    ? query(evacuees, where("barangay", "==", barangay))
    : evacuees

  return onSnapshot(checkInQuery, (snapshot) => {
    callback(snapshot.docs.map((evacueeDoc) => ({ id: evacueeDoc.id, ...evacueeDoc.data() })))
  }, (error) => {
    console.error("Error subscribing to active evacuees:", error)
    callback([])
  })
}

export function subscribeToEvacueeHistory({ barangay = "" } = {}, callback) {
  const records = collection(db, "evacueeHistory")
  const historyQuery = barangay ? query(records, where("barangay", "==", barangay)) : records

  return onSnapshot(historyQuery, (snapshot) => {
    callback(snapshot.docs.map((record) => ({ id: record.id, ...record.data() })))
  }, (error) => {
    console.error("Error subscribing to evacuee history:", error)
    callback([])
  })
}

export async function deleteEvacueeHistory(historyId) {
  await deleteDoc(doc(db, "evacueeHistory", historyId))
}

export function subscribeToResidentEvacueeHistory(residentUid, callback) {
  const historyQuery = query(collection(db, "evacueeHistory"), where("residentUid", "==", residentUid))

  return onSnapshot(historyQuery, (snapshot) => {
    const records = snapshot.docs.map((record) => ({ id: record.id, ...record.data() }))
    records.sort((a, b) => (b.checkedInAt?.toMillis?.() || 0) - (a.checkedInAt?.toMillis?.() || 0))
    callback(records)
  }, (error) => {
    console.error("Error subscribing to resident check-in history:", error)
    callback([])
  })
}

// Normalizes barangay names so common abbreviations (e.g. "Brgy 5") match their
// full form (e.g. "Barangay 5").
function normalizeBarangay(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\bbrgy\.?\b/g, "barangay")
    .replace(/\s+/g, " ")
}

// Live-subscribes to the "users" collection, optionally filtered by role and/or barangay.
// Both are compared client-side (trimmed, case-insensitive) since manually edited
// records can differ in casing/whitespace from the dropdown-selected/registered value.
export function subscribeToUsers({ role, barangay } = {}, callback) {
  const normalizedRole = role ? role.trim().toLowerCase() : ""
  const normalizedBarangay = normalizeBarangay(barangay)

  return onSnapshot(collection(db, "users"), (snapshot) => {
    let users = snapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }))
    if (normalizedRole) {
      users = users.filter((user) => (user.role || "").trim().toLowerCase() === normalizedRole)
    }
    if (normalizedBarangay) {
      users = users.filter((user) => normalizeBarangay(user.barangay) === normalizedBarangay)
    }
    callback(users)
  }, (error) => {
    console.error("Error subscribing to users:", error)
    callback([])
  })
}

export async function updateUserProfileFields(uid, updates) {
  await updateDoc(doc(db, "users", uid), updates)
}

export async function updateCurrentUserProfile({ name, phone, barangay }) {
  const user = auth.currentUser
  if (!user) throw new Error("You must be signed in to update your profile.")

  const profileUpdates = {
    name: name.trim(),
    phone: phone.trim(),
    barangay: barangay.trim(),
    updatedAt: serverTimestamp(),
  }

  await Promise.all([
    updateDoc(doc(db, "users", user.uid), profileUpdates),
    updateProfile(user, { displayName: profileUpdates.name }),
  ])
}

export async function markCurrentUserNotificationsRead() {
  const user = auth.currentUser
  if (!user) return
  await updateDoc(doc(db, "users", user.uid), { lastNotificationReadAt: serverTimestamp() })
}

export async function deleteUserProfile(uid) {
  await deleteDoc(doc(db, "users", uid))
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid))
  return snapshot.exists() ? snapshot.data() : null
}

// Live-subscribes to a single user's profile document (e.g. to react to admin edits without re-login).
export function subscribeToUserProfile(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null)
  })
}

export async function createAnnouncement({ type, audience, priority, title, message }) {
  const user = auth.currentUser
  if (!user) throw new Error("You must be signed in to send an announcement.")

  const senderProfile = await getUserProfile(user.uid)
  if (!senderProfile || !["staff", "admin"].includes(senderProfile.role)) {
    throw new Error("This account is not configured as a staff or admin account in Firestore. Ask an administrator to create the staff account from User Management, then sign in with that account.")
  }

  return addDoc(collection(db, "announcements"), {
    type,
    audience,
    priority,
    title: title.trim(),
    message: message.trim(),
    authorUid: user.uid,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToAnnouncements(callback, audiences = null) {
  const announcementsQuery = audiences
    ? query(collection(db, "announcements"), where("audience", audiences.length === 1 ? "==" : "in", audiences))
    : query(collection(db, "announcements"), orderBy("createdAt", "desc"))

  return onSnapshot(announcementsQuery, (snapshot) => {
    const announcements = snapshot.docs
      .map((announcementDoc) => ({ id: announcementDoc.id, ...announcementDoc.data() }))
      .sort((first, second) => (second.createdAt?.toMillis?.() || 0) - (first.createdAt?.toMillis?.() || 0))
    callback(announcements)
  }, (error) => {
    console.error("Error subscribing to announcements:", error)
    callback([])
  })
}

export function subscribeToDismissedAnnouncements(callback) {
  const user = auth.currentUser
  if (!user) {
    callback([])
    return () => {}
  }

  return onSnapshot(collection(db, "users", user.uid, "notificationDismissals"), (snapshot) => {
    callback(snapshot.docs.map((dismissal) => dismissal.id))
  }, (error) => {
    console.error("Error subscribing to dismissed announcements:", error)
    callback([])
  })
}

export async function dismissCurrentUserAnnouncement(announcementId) {
  const user = auth.currentUser
  if (!user) throw new Error("You must be signed in to delete a notification.")
  await setDoc(doc(db, "users", user.uid, "notificationDismissals", announcementId), {
    createdAt: serverTimestamp(),
  })
}