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
  const [idPhoto, setIdPhoto] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !password || !barangay || !phone || !idPhoto) {
      alert('Please fill all required fields, including phone number and ID photo.')
      return
    }
    setIsLoading(true)
    const payload = { role, name, email, password, barangay, phone, idPhoto }
    if (onSubmit) onSubmit(payload)
    else alert('Registered: ' + JSON.stringify(payload))
    setName('')
    setEmail('')
    setPassword('')
    setPhone('')
    setBarangay('')
    setIdPhoto(null)
    setRole('user')
    setIsLoading(false)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setIdPhoto(file)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <p className="homepage-eyebrow">EvacReady</p>
        <h1>Create account</h1>
        <p className="register-intro">Set up access for your role in the emergency response team.</p>
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="login-field">
          <label htmlFor="role">Account type</label>
          <select id="role" name="role" value={role} onChange={e => setRole(e.target.value)} required>
            <option value="user">Users</option>
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <div className="login-field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" type="tel" placeholder="09XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>

        <div className="login-field">
          <label htmlFor="idPhoto">ID Photo</label>
          <input id="idPhoto" name="idPhoto" type="file" accept="image/*" onChange={handlePhotoChange} required />
          {idPhoto && <p style={{ fontSize: '12px', color: '#bfdbfe', marginTop: '4px' }}>Selected: {idPhoto.name}</p>}
        </div>

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
        <button className="google-submit" type="button" onClick={() => {
          setIsLoading(true)
          onGoogleAccount()
        }} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              <span>Signing in...</span>
            </>
          ) : (
            '🔵 Continue with Google'
          )}
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
