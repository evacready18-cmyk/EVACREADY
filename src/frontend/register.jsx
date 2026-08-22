import { useState } from 'react'
import './login.css'
import { BARANGAYS } from './data/barangays'

function RegisterForm({ onSubmit, onBack, onGoogleAccount }) {
  const [role, setRole] = useState('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [barangay, setBarangay] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !password || !barangay || (role !== 'admin' && !phone)) {
      alert('Please fill all required fields, including phone number for users and staff.')
      return
    }
    const payload = { role, name, email, password, barangay, ...(role !== 'admin' && { phone }) }
    if (onSubmit) onSubmit(payload)
    else alert('Registered: ' + JSON.stringify(payload))
    setName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setBarangay('')
    setRole('user')
  }

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <p className="homepage-eyebrow">EvacReady</p>
        <h1>Create account</h1>
        <p className="register-intro">Set up access for your role in the emergency response team.</p>
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="role">Account type</label>
          <select id="role" name="role" value={role} onChange={e => setRole(e.target.value)} required>
            <option value="user">User</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        {role !== 'admin' && (
          <div className="login-field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" type="tel" placeholder="09XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
        )}

        <div className="login-field">
          <label htmlFor="barangay">Barangay</label>
          <select id="barangay" name="barangay" value={barangay} onChange={e => setBarangay(e.target.value)} required>
            <option value="">Select barangay</option>
            {BARANGAYS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <button className="login-submit" type="submit">Create account</button>
        <button className="google-submit" type="button" onClick={onGoogleAccount}>
          Continue with Google
        </button>
        <button className="homepage-link secondary register-back" type="button" onClick={onBack}>
          Back to sign in
        </button>
      </form>
      </div>
    </div>
  )
}

export default RegisterForm
