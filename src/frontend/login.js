export function initLogin() {
  const loginForm = document.querySelector('.login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const email = loginForm.querySelector('input[name="email"]').value.trim();
    const password = loginForm.querySelector('input[name="password"]').value.trim();

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    alert(`Logged in as ${email}`);
    loginForm.reset();
  });
}
