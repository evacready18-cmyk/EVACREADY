const sectionTitles = {
  'staff-information': 'My Information',
  'staff-request': 'Request',
  'staff-announcement': 'Announcement',
  'staff-feedback': 'Feedback',
  'staff-emergency-call': 'Emergency Call',
}

function StaffSection({ page }) {
  const title = sectionTitles[page] || 'Staff dashboard'

  return (
    <section className="home-page">
      <header className="home-header">
        <div>
          <p className="home-subtitle">Staff workspace</p>
          <h1>{title}</h1>
        </div>
      </header>
      <section className="panel" style={{ maxWidth: '720px', maxHeight: 'none' }}>
        <h2>{title}</h2>
        <p>This staff section is ready for its workflow and data.</p>
      </section>
    </section>
  )
}

export default StaffSection
