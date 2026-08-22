import React, { useState } from 'react'
import './login.css'

export function initLogin() {
  const loginForm = document.querySelector('.login-form')
  if (!loginForm) return

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault()

    const email = loginForm.querySelector('input[name="email"]').value.trim()
    const password = loginForm.querySelector('input[name="password"]').value.trim()

    if (!email || !password) {
      alert('Please enter both email and password.')
      return
    }

    alert(`Logged in as ${email}`)
    loginForm.reset()
  })
}

function LoginHomepage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!email || !password) {
      alert('Please enter both email and password.')
      return
    }

    alert(`Logged in as ${email}`)
    setEmail('')
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
