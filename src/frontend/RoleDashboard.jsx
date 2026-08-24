import './role-dashboard.css'

const dashboardContent = {
  user: {
    label: 'Resident dashboard',
    title: 'Stay informed and ready',
    description: 'View emergency alerts, find nearby evacuation centers, and keep your household prepared.',
    actions: ['View active alerts', 'Find evacuation center', 'Update my information'],
  },
  staff: {
    label: 'Staff dashboard',
    title: 'Coordinate response activities',
    description: 'Monitor assigned operations, manage evacuee support, and keep your response team aligned.',
    actions: ['View assigned tasks', 'Manage evacuees', 'Check evacuation centers'],
  },
}

function RoleDashboard({ role, onLogout }) {
  const content = dashboardContent[role] || dashboardContent.user

  return (
    <div className={`role-dashboard role-dashboard--${role}`}>
      <header className="role-dashboard__header">
        <p className="role-dashboard__label">{content.label}</p>
        <h1>{content.title}</h1>
        <p className="role-dashboard__description">{content.description}</p>
        <button className="role-dashboard__logout" type="button" onClick={onLogout}>
          Log out
        </button>
      </header>

      <section className="role-dashboard__actions" aria-label="Dashboard actions">
        {content.actions.map((action) => (
          <button className="role-dashboard__action" type="button" key={action}>
            <span>{action}</span>
            <span aria-hidden="true">-&gt;</span>
          </button>
        ))}
      </section>
    </div>
  )
}

export default RoleDashboard
