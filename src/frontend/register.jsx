import React, { useState } from 'react'
import './login.css'
import { BARANGAYS } from './data/barangays'

function RegisterForm({ onSubmit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [barangay, setBarangay] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !password || !barangay) {
      alert('Please fill all required fields, including barangay.')
      return
    }
    const payload = { name, email, password, barangay }
    if (onSubmit) onSubmit(payload)
    else alert('Registered: ' + JSON.stringify(payload))
    setName('')
    setEmail('')
    setPassword('')
    setBarangay('')
  }

  return (
    <div className="register-card">
      <h2>Create account</h2>
      <form className="register-form" onSubmit={handleSubmit}>
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
      </form>
    </div>
  )
}

export default RegisterForm
