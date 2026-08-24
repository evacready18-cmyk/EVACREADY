const sectionTitles = {
  'user-information': 'My Information',
  'user-request': 'Request',
  'user-announcement': 'Announcement',
  'user-feedback': 'Feedback',
  'user-emergency-call': 'Emergency Call',
}

function UserSection({ page }) {
  const title = sectionTitles[page] || 'My Information'

  return (
    <section className="home-page">
      <header className="home-header">
        <div>
          <p className="home-subtitle">User workspace</p>
          <h1>{title}</h1>
        </div>
      </header>
      <section className="panel" style={{ maxWidth: '720px', maxHeight: 'none' }}>
        <h2>{title}</h2>
        <p>This user section is ready for its workflow and data.</p>
      </section>
    </section>
  )
}

export default UserSection
