/* DETwal signup: Supabase Auth + client-side validation. */
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initSignupValidation();
  initRevealAnimations();
  setCurrentYear();
});

function initPasswordToggles() {
  document.querySelectorAll('.toggle-password').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = document.getElementById(toggle.getAttribute('data-target'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      const eye = toggle.querySelector('.icon-eye');
      const eyeOff = toggle.querySelector('.icon-eye-off');
      if (eye) eye.hidden = show;
      if (eyeOff) eyeOff.hidden = !show;
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });
}

function initSignupValidation() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const fields = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
    terms: document.getElementById('terms')
  };
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('signupSubmit');

  fields.fullName.addEventListener('blur', validateFullName);
  fields.email.addEventListener('blur', validateEmail);
  fields.password.addEventListener('blur', validatePassword);
  fields.confirmPassword.addEventListener('blur', validateConfirmPassword);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const valid = validateFullName() && validateEmail() &&
      validatePassword() && validateConfirmPassword() && validateTerms();
    if (!valid) {
      setStatus('Please correct the highlighted fields above.', 'error');
      return;
    }

    const supabase = window.detwalSupabase;
    if (!supabase) {
      setStatus('Authentication could not load. Refresh the page and try again.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';
    setStatus('Creating your account securely…', 'info');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: fields.email.value.trim(),
        password: fields.password.value,
        options: {
          data: { full_name: fields.fullName.value.trim(), referral_code: (document.getElementById('referralCode')?.value || new URLSearchParams(location.search).get('ref') || '').trim().toUpperCase() },
          emailRedirectTo: 'https://detwal.in/detwal/login.html'
        }
      });

      if (error) throw error;

      // Supabase may return a generic success response for an existing email.
      // With email confirmation enabled, an empty identities array identifies that case.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setStatus('This email is already registered. Please log in or use Forgot Password.', 'error');
        return;
      }

      if (data.session) {
        setStatus('Your account has been created. Opening the store…', 'success');
        window.location.assign('store.html');
      } else {
        setStatus('Account created. Please check your email and confirm your address before logging in.', 'success');
        form.reset();
      }
    } catch (error) {
      setStatus(getFriendlyAuthError(error), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });

  function validateFullName() {
    const valid = fields.fullName.value.trim().length >= 2;
    return showFieldResult('fullName', valid, 'Please enter your full name.');
  }

  function validateEmail() {
    const value = fields.email.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return showFieldResult('email', valid, 'Please enter a valid email address.');
  }

  function validatePassword() {
    const value = fields.password.value;
    const valid = value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
    return showFieldResult('password', valid, 'Use at least 8 characters, including a letter and a number.');
  }

  function validateConfirmPassword() {
    const valid = fields.confirmPassword.value.length > 0 &&
      fields.confirmPassword.value === fields.password.value;
    return showFieldResult('confirmPassword', valid, 'Passwords do not match.');
  }

  function validateTerms() {
    return showFieldResult('terms', fields.terms.checked, 'You must agree to continue.');
  }

  function showFieldResult(name, valid, message) {
    const field = fields[name];
    const group = field.closest('.form-group');
    const errorEl = document.getElementById(name + 'Error');
    if (group) group.classList.toggle('has-error', !valid);
    if (errorEl) errorEl.textContent = valid ? '' : message;
    return valid;
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove('status-error', 'status-info', 'status-success');
    if (type) statusEl.classList.add('status-' + type);
  }
}

function getFriendlyAuthError(error) {
  const message = (error && error.message) ? error.message : 'Something went wrong. Please try again.';
  if (/already registered|already exists|user already registered|email.*(taken|exists)/i.test(message)) return 'This email is already registered. Please log in or use Forgot Password.';
  if (/password should be|weak password/i.test(message)) return 'Your password does not meet the security requirements.';
  if (/rate limit|too many requests/i.test(message)) return 'Too many attempts. Please wait a while and try again.';
  return message;
}

function initRevealAnimations() {
  const elements = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !elements.length) {
    elements.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach((el) => observer.observe(el));
}

function setCurrentYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}