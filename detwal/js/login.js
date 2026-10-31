document.addEventListener('DOMContentLoaded', () => {
  const API = 'https://detwal-api.dakshdetwal10.workers.dev';
  const ADMIN_EMAIL = 'support@admin.com';
  const form = document.getElementById('loginForm');
  const status = document.getElementById('formStatus');
  const button = document.getElementById('loginSubmit');
  const buttonText = button?.querySelector('.btn-text');
  const spinner = button?.querySelector('.btn-spinner');

  // Ensure page entrance animations never leave the form invisible.
  document.querySelectorAll('.reveal').forEach(element => {
    element.classList.add('in-view');
  });

  const setStatus = (message, type = 'info') => {
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status status-' + type;
  };

  const setLoading = loading => {
    if (button) button.disabled = loading;
    if (buttonText) buttonText.textContent = loading ? 'Logging In…' : 'Log In';
    if (spinner) spinner.hidden = !loading;
  };

  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      const eye = toggle.querySelector('.icon-eye');
      const eyeOff = toggle.querySelector('.icon-eye-off');
      if (eye) eye.hidden = visible;
      if (eyeOff) eyeOff.hidden = !visible;
    });
  });

  if (!form || !button) {
    console.error('DETwal login form elements are missing.');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const email = emailInput?.value.trim().toLowerCase() || '';
    const password = passwordInput?.value || '';
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (emailError) emailError.textContent = '';
    if (passwordError) passwordError.textContent = '';

    if (!validEmail || !password) {
      if (emailError && !validEmail) emailError.textContent = 'Please enter a valid email address.';
      if (passwordError && !password) passwordError.textContent = 'Please enter your password.';
      setStatus('Please check your email and password.', 'error');
      return;
    }

    setLoading(true);
    setStatus('Signing you in…');

    try {
      if (email === ADMIN_EMAIL) {
        const response = await fetch(API + '/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !result.token) {
          throw new Error(result.message || 'Admin login failed. Please check your credentials.');
        }

        sessionStorage.setItem('detwal_admin_token', result.token);
        sessionStorage.setItem('detwal_admin_email', email);
        setStatus('Admin login successful. Opening dashboard…', 'success');
        window.location.assign('admin.html');
        return;
      }

      const client = window.detwalSupabase;
      if (!client) {
        throw new Error('Login service did not load. Refresh the page and try again.');
      }

      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setStatus('Login successful. Opening your account…', 'success');
      window.location.assign('store.html');
    } catch (error) {
      console.error('DETwal login error:', error);
      setStatus(error.message || 'Unable to log in. Please try again.', 'error');
      setLoading(false);
    }
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});