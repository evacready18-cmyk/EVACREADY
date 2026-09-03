import { useState } from 'react'
import './login.css'
import { BARANGAYS } from './data/barangays'
import { uploadToCloudinary } from '../services/cloudinary'

function RegisterForm({ onSubmit, onBack }) {
  const [role, setRole] = useState('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [barangay, setBarangay] = useState('')
  const [idPhoto, setIdPhoto] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password || !barangay || !phone || !verificationId || !idPhoto) {
      alert('Please fill all required fields, including your verification ID, phone number, and ID photo.')
      return
    }
    if (!/^09\d{9}$/.test(phone) && !/^\+639\d{9}$/.test(phone)) {
      alert('Please enter a valid Philippine mobile number in 09XXXXXXXXX or +639XXXXXXXXX format.')
      return
    }
    setIsLoading(true)
    try {
      const idPhotoUrl = await uploadToCloudinary(idPhoto)
      const payload = { role, name, email, password, barangay, phone, verificationId, idPhotoUrl }
      if (onSubmit) {
        const wasRegistered = await onSubmit(payload)
        if (!wasRegistered) return
      } else {
        alert('Registered: ' + JSON.stringify(payload))
      }
      setName('')
      setEmail('')
      setPassword('')
      setShowPassword(false)
      setPhone('')
      setVerificationId('')
      setBarangay('')
      setIdPhoto(null)
      setRole('user')
    } catch (error) {
      alert(error.message || 'Unable to upload ID photo.')
    } finally {
      setIsLoading(false)
    }
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
            <option value="user">Resident</option>
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrap">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z" />
                  <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="login-field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" pattern="(09|\+639)[0-9]{9}" title="Use 09XXXXXXXXX or +639XXXXXXXXX format" placeholder="09XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>

        <div className="login-field">
          <label htmlFor="verificationId">Barangay verification ID</label>
          <input id="verificationId" name="verificationId" type="text" placeholder="Enter your barangay ID number" value={verificationId} onChange={e => setVerificationId(e.target.value)} required />
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

        <button className="login-submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create account'}
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
