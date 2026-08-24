import React, { useState } from 'react'
import './login.css'

export function initLogin() {
  const loginForm = document.querySelector('.login-form')
  if (!loginForm) return

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault()

    const phone = loginForm.querySelector('input[name="phone"]').value.trim()
    const password = loginForm.querySelector('input[name="password"]').value.trim()

    if (!phone || !password) {
      alert('Please enter both phone number and password.')
      return
    }

    alert(`Logged in as ${phone}`)
    loginForm.reset()
  })
}

function LoginHomepage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!phone || !password) {
      alert('Please enter both phone number and password.')
      return
    }

    alert(`Logged in as ${phone}`)
    setPhone('')
    setPassword('')
  }

  return (
    <div className="login-page">
      <div className="login-card homepage-card">
        <div className="homepage-hero">
          <p className="homepage-eyebrow">EvacReady</p>
          <h1>Stay prepared and respond faster during emergencies.</h1>
          <p>
            Coordinate alerts, track evacuation centers, and support your community in real time.
          </p>
          <div className="homepage-actions">
            <a className="homepage-link primary" href="#login">
              Create account
            </a>
            <a className="homepage-link secondary" href="#learn-more">
              Learn more
            </a>
          </div>
        </div>

        <form className="login-form homepage-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="09XXXXXXXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button className="login-submit" type="submit">
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginHomepage
