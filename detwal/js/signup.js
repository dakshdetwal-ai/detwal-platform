/* ==========================================================================
   DETwal — Signup Page JS
   Client-side validation only. No authentication or backend calls.
   Structured for future integration with Supabase Auth / Cloudflare Workers.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initSignupValidation();
  initRevealAnimations();
  setCurrentYear();
});

/* --------------------------------------------------------------------------
   Password Visibility Toggles
   -------------------------------------------------------------------------- */
function initPasswordToggles() {
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

/* --------------------------------------------------------------------------
   Signup Form Validation
   -------------------------------------------------------------------------- */
function initSignupValidation() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const fields = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
    terms: document.getElementById('terms'),
  };

  const statusEl = document.getElementById('formStatus');

  // Validate a single field on blur for immediate feedback
  fields.fullName.addEventListener('blur', () => validateFullName());
  fields.email.addEventListener('blur', () => validateEmail());
  fields.password.addEventListener('blur', () => validatePassword());
  fields.confirmPassword.addEventListener('blur', () => validateConfirmPassword());

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isFullNameValid = validateFullName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();
    const isTermsValid = validateTerms();

    const isFormValid = isFullNameValid && isEmailValid && isPasswordValid && isConfirmValid && isTermsValid;

    if (!isFormValid) {
      setStatus('Please correct the highlighted fields above.', 'error');
      return;
    }

    // No backend is connected yet. We intentionally avoid any fake
    // "Account created!" message. This is a transparent placeholder
    // until Supabase Auth / Cloudflare Workers integration is complete.
    setStatus(
      'Your details look good. Account creation will be enabled once our backend is connected — please check back soon.',
      'info'
    );

    // TODO (future integration):
    // Replace the block above with a call to Supabase Auth / Cloudflare Workers, e.g.:
    // const result = await supabase.auth.signUp({ email, password });
  });

  function validateFullName() {
    const value = fields.fullName.value.trim();
    if (value.length < 2) {
      showError('fullName', 'Please enter your full name.');
      return false;
    }
    clearError('fullName');
    return true;
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showError('email', 'Please enter a valid email address.');
      return false;
    }
    clearError('email');
    return true;
  }

  function validatePassword() {
    const value = fields.password.value;
    const hasMinLength = value.length >= 8;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    if (!hasMinLength || !hasLetter || !hasNumber) {
      showError('password', 'Password must be at least 8 characters and include a letter and a number.');
      return false;
    }
    clearError('password');
    return true;
  }

  function validateConfirmPassword() {
    const value = fields.confirmPassword.value;
    if (value !== fields.password.value || value.length === 0) {
      showError('confirmPassword', 'Passwords do not match.');
      return false;
    }
    clearError('confirmPassword');
    return true;
  }

  function validateTerms() {
    if (!fields.terms.checked) {
      showError('terms', 'You must agree to the terms to continue.');
      return false;
    }
    clearError('terms');
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
}

/* --------------------------------------------------------------------------
   Scroll Reveal Animation (consistent with homepage)
   -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   Dynamic Copyright Year
   -------------------------------------------------------------------------- */
function setCurrentYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
