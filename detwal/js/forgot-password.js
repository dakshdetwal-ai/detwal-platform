/* ==========================================================================
   DETwal — Forgot Password Page JS
   Client-side validation and UI states only. No email delivery, no
   authentication logic, no API keys. Structured for future Supabase
   password-reset integration (see TODO markers).
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initForgotPasswordValidation();
  initRevealAnimations();
  setCurrentYear();
});

/* Forgot Password Form Validation */
function initForgotPasswordValidation() {
  const form = document.getElementById('forgotPasswordForm');
  if (!form) return;

  const emailField = document.getElementById('email');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('resetSubmit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  emailField.addEventListener('blur', () => validateEmail());
  emailField.addEventListener('input', () => {
    // Clear stale status message once the user starts correcting input
    if (statusEl.classList.contains('status-error')) {
      setStatus('', null);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isEmailValid = validateEmail();

    if (!isEmailValid) {
      setStatus('Please enter a valid email address to continue.', 'error');
      return;
    }

    setLoadingState(true);
    setStatus('Processing your request…', 'info');

    // No backend is connected yet. We intentionally avoid any fake
    // "Reset link sent!" message, since no email is actually being
    // delivered. This simulated delay only demonstrates the loading
    // state UX until Supabase password-reset is wired in.
    //
    // TODO (future integration):
    // Replace the block below with a real call, e.g.:
    // const { data, error } = await supabase.auth.resetPasswordForEmail(
    //   emailField.value.trim(),
    //   { redirectTo: 'https://yourdomain.com/reset-password.html' }
    // );
    window.setTimeout(() => {
      setLoadingState(false);
      setStatus(
        'Password reset is not yet connected to our backend. No email has been sent. Please check back soon or contact support.',
        'info'
      );
    }, 1200);
  });

  function validateEmail() {
    const value = emailField.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (value.length === 0) {
      showError('Please enter your registered email address.');
      return false;
    }
    if (!emailRegex.test(value)) {
      showError('Please enter a valid email address.');
      return false;
    }
    clearError();
    return true;
  }

  function showError(message) {
    const group = emailField.closest('.form-group');
    const errorEl = document.getElementById('emailError');
    if (group) group.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError() {
    const group = emailField.closest('.form-group');
    const errorEl = document.getElementById('emailError');
    if (group) group.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove('status-error', 'status-info', 'status-success');
    if (type) statusEl.classList.add(`status-${type}`);
  }

  function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Sending…' : 'Send Reset Link';
    btnSpinner.hidden = !isLoading;
  }
}

/* Scroll Reveal Animation (consistent with homepage/login/signup) */
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
