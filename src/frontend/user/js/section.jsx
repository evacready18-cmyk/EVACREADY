import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

const sectionTitles = {
  'user-information': 'My Information',
  'user-request': 'Request',
  'user-announcement': 'Announcement',
  'user-feedback': 'Feedback',
  'user-emergency-call': 'Emergency Call',
}

function UserSection({ page, currentUid }) {
  const title = sectionTitles[page] || 'My Information'

  return (
    <section className="home-page">
      <header className="home-header">
        <div>
          <p className="home-subtitle">Resident workspace</p>
          <h1>{title}</h1>
        </div>
      </header>
      <section className="panel" style={{ maxWidth: '720px', maxHeight: 'none' }}>
        <h2>{title}</h2>
        <p>This resident section is ready for its workflow and data.</p>
      </section>
      {page === 'user-information' && (
        <section className="panel" style={{ maxWidth: '720px', maxHeight: 'none' }}>
          <h2>Resident QR Code</h2>
          <p>Present this code to a staff member for evacuation-center check-in.</p>
          {currentUid && <QRCodeSVG value={currentUid} size={180} level="M" includeMargin />}
        </section>
      )}
    </section>
  )
}

export default UserSection
