document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(input.type === 'text'));
      toggle.setAttribute('aria-label', input.type === 'text' ? 'Hide password' : 'Show password');
      toggle.querySelector('.icon-eye').hidden = input.type === 'text';
      toggle.querySelector('.icon-eye-off').hidden = input.type !== 'text';
    });
  });
  const form = document.getElementById('loginForm');
  const status = document.getElementById('formStatus');
  const button = document.getElementById('loginSubmit');
  const setStatus = (message, type='info') => {
    status.textContent = message;
    status.className = 'form-status status-' + type;
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      if (!email) document.getElementById('emailError').textContent = 'Please enter a valid email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) document.getElementById('emailError').textContent = 'Please enter a valid email address.';
      if (!password) document.getElementById('passwordError').textContent = 'Please enter your password.';
      setStatus('Please correct the highlighted fields.', 'error'); return;
    }
    const client = window.detwalSupabase;
    if (!client) { setStatus('Authentication failed to load. Please refresh and try again.', 'error'); return; }
    button.disabled = true;
    button.querySelector('.btn-text').textContent = 'Logging In…';
    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus('Login successful. Your account is signed in.', 'success');
      // Dashboard is not deployed yet; keep the authenticated session and avoid a broken redirect.
    } catch (error) {
      const msg = /invalid login credentials/i.test(error.message) ? 'Email or password is incorrect.' : error.message;
      setStatus(msg || 'Unable to log in. Please try again.', 'error');
    } finally {
      button.disabled = false;
      button.querySelector('.btn-text').textContent = 'Log In';
    }
  });
  const year=document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));
});