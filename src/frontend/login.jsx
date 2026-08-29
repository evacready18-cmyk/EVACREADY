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

function LoginHomepage({ onContinue, onCreateAccount, onGoogleAccount }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email || !password) {
      alert('Please enter both email and password.')
      return
    }
    setIsLoading(true)
    setEmail('')
    setPassword('')
    if (onContinue) onContinue({ email, password })
    // Simulate loading time - remove this in production when you have real auth
    setTimeout(() => setIsLoading(false), 1500)
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
            <button className="homepage-link primary" type="button" onClick={onCreateAccount}>
              Create account
            </button>
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
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-eye-fill"
                    viewBox="0 0 16 16"
                  >
                    <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                    <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-eye-slash-fill"
                    viewBox="0 0 16 16"
                  >
                    <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z" />
                    <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button className="login-submit" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
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
        </form>
      </div>
    </div>
  )
}

export default LoginHomepage
