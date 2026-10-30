/* ==========================================================================
   DETwal — Login Page JS
   Client-side validation and UI states only. No authentication logic,
   no API keys, no backend calls. Structured for future Supabase Auth
   integration (see TODO markers).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  initLoginValidation();
  initRevealAnimations();
  setCurrentYear();
});

/* Password Visibility Toggle */
function initPasswordToggle() {
  const toggles = document.querySelectorAll('.toggle-password');

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeIcon = toggle.querySelector('.icon-eye');
      const eyeOffIcon = toggle.querySelector('.icon-eye-off');
      eyeIcon.hidden = isPassword;
      eyeOffIcon.hidden = !isPassword;

      toggle.setAttribute('aria-pressed', String(isPassword));
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

/* Login Form Validation */
function initLoginValidation() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const fields = {
    email: document.getElementById('email'),
    password: document.getElementById('password'),
  };

  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('loginSubmit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  fields.email.addEventListener('blur', () => validateEmail());
  fields.password.addEventListener('blur', () => validatePassword());

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isFormValid = isEmailValid && isPasswordValid;

    if (!isFormValid) {
      setStatus('Please correct the highlighted fields above.', 'error');
      return;
    }

    setLoadingState(true);
    setStatus('Verifying your details…', 'info');

    // No backend is connected yet. We intentionally avoid any fake
    // "Logged in!" message or redirect. This simulated delay only
    // demonstrates the loading state UX until Supabase Auth is wired in.
    //
    // TODO (future integration):
    // Replace the block below with a real call, e.g.:
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: fields.email.value.trim(),
    //   password: fields.password.value,
    // });
    window.setTimeout(() => {
      setLoadingState(false);
      setStatus(
        'Login is not yet connected to our backend. Please check back soon.',
        'info'
      );
    }, 1200);
  });

  function validateEmail() {
    const value = fields.email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length === 0) {
      showError('email', 'Please enter your email address.');
      return false;
    }
    if (!emailRegex.test(value)) {
      showError('email', 'Please enter a valid email address.');
      return false;
    }
    clearError('email');
    return true;
  }

  function validatePassword() {
    const value = fields.password.value;
    if (value.length === 0) {
      showError('password', 'Please enter your password.');
      return false;
    }
    clearError('password');
    return true;
  }

  function showError(fieldName, message) {
    const field = fields[fieldName];
    const group = field.closest('.form-group');
    const errorEl = document.getElementById(`${fieldName}Error`);
    if (group) group.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(fieldName) {
    const field = fields[fieldName];
    const group = field.closest('.form-group');
    const errorEl = document.getElementById(`${fieldName}Error`);
    if (group) group.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove('status-error', 'status-info');
    statusEl.classList.add(type === 'error' ? 'status-error' : 'status-info');
  }

  function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Logging In…' : 'Log In';
    btnSpinner.hidden = !isLoading;
  }
}

/* Scroll Reveal Animation (consistent with homepage/signup) */
function initRevealAnimations() {
  const revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || revealEls.length === 0) {
    revealEls.forEach((el) => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* Dynamic Copyright Year */
function setCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
