/* ==========================================================================
   DETwal — Reset Password Page JS
   Client-side validation, strength meter and UI states only.
   No fake password updates, no API keys, no secrets.

   IMPORTANT — Supabase Recovery Flow (for future integration):
   When a user clicks the password-reset link from their email, Supabase
   redirects them here with a recovery session encoded in the URL
   (handled automatically by supabase-js when `detectSessionInUrl: true`
   is set on the client). Before allowing a password update, the app
   must confirm a valid recovery session exists — typically by listening
   for the `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange()`
   or by checking `supabase.auth.getSession()`.

   This file intentionally does NOT simulate or fake that session check.
   It only prepares the structure (see `checkRecoverySession()` and the
   TODO markers below) so real Supabase logic can be dropped in later
   without reworking the UI.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  checkRecoverySession();
  initPasswordToggles();
  initStrengthMeter();
  initResetPasswordValidation();
  initRevealAnimations();
  setCurrentYear();
});

/* --------------------------------------------------------------------------
   Recovery Session Check (structural placeholder only)
   -------------------------------------------------------------------------- */
function checkRecoverySession() {
  const notice = document.getElementById('sessionNotice');
  if (!notice) return;

  // Supabase typically appends recovery info to the URL hash, e.g.:
  // #access_token=...&type=recovery
  // This is a lightweight structural check only — it does NOT verify
  // the token's validity. Real verification must happen via supabase-js.
  const hash = window.location.hash || '';
  const hasRecoveryIndicator = hash.includes('type=recovery') || hash.includes('access_token');

  if (!hasRecoveryIndicator) {
    notice.hidden = false;
  }

  // TODO (future integration):
  // supabase.auth.onAuthStateChange((event, session) => {
  //   if (event === 'PASSWORD_RECOVERY' && session) {
  //     notice.hidden = true;
  //     // Enable the form — a valid recovery session is active.
  //   } else {
  //     notice.hidden = false;
  //     // Keep the form disabled or redirect to forgot-password.html.
  //   }
  // });
}

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
   Password Rules
   -------------------------------------------------------------------------- */
const PASSWORD_RULES = {
  length: (value) => value.length >= 8,
  uppercase: (value) => /[A-Z]/.test(value),
  lowercase: (value) => /[a-z]/.test(value),
  number: (value) => /[0-9]/.test(value),
};

function getPasswordRuleResults(value) {
  const results = {};
  Object.keys(PASSWORD_RULES).forEach((rule) => {
    results[rule] = PASSWORD_RULES[rule](value);
  });
  return results;
}

function isPasswordValid(value) {
  const results = getPasswordRuleResults(value);
  return Object.values(results).every(Boolean);
}

/* --------------------------------------------------------------------------
   Live Requirements Checklist + Strength Meter
   -------------------------------------------------------------------------- */
function initStrengthMeter() {
  const passwordInput = document.getElementById('newPassword');
  const requirementItems = document.querySelectorAll('.password-requirements li');
  const strengthMeter = document.getElementById('strengthMeter');
  const strengthLabel = document.getElementById('strengthLabel');

  if (!passwordInput) return;

  passwordInput.addEventListener('input', () => {
    const value = passwordInput.value;
    const results = getPasswordRuleResults(value);

    requirementItems.forEach((item) => {
      const rule = item.getAttribute('data-rule');
      item.classList.toggle('met', Boolean(results[rule]));
    });

    updateStrengthMeter(value, results, strengthMeter, strengthLabel);
  });
}

function updateStrengthMeter(value, results, meterEl, labelEl) {
  if (!meterEl || !labelEl) return;

  meterEl.classList.remove('level-1', 'level-2', 'level-3', 'level-4');

  if (value.length === 0) {
    labelEl.textContent = '';
    return;
  }

  const metCount = Object.values(results).filter(Boolean).length;
  let level = 1;
  let label = 'Weak';

  if (metCount === 4 && value.length >= 12) {
    level = 4;
    label = 'Strong';
  } else if (metCount === 4) {
    level = 3;
    label = 'Good';
  } else if (metCount >= 2) {
    level = 2;
    label = 'Fair';
  } else {
    level = 1;
    label = 'Weak';
  }

  meterEl.classList.add(`level-${level}`);
  labelEl.textContent = label;
}

/* --------------------------------------------------------------------------
   Reset Password Form Validation
   -------------------------------------------------------------------------- */
function initResetPasswordValidation() {
  const form = document.getElementById('resetPasswordForm');
  if (!form) return;

  const fields = {
    newPassword: document.getElementById('newPassword'),
    confirmNewPassword: document.getElementById('confirmNewPassword'),
  };

  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('resetSubmit');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  fields.newPassword.addEventListener('blur', () => validateNewPassword());
  fields.confirmNewPassword.addEventListener('blur', () => validateConfirmPassword());

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isNewPasswordValid = validateNewPassword();
    const isConfirmValid = validateConfirmPassword();
    const isFormValid = isNewPasswordValid && isConfirmValid;

    if (!isFormValid) {
      setStatus('Please correct the highlighted fields above.', 'error');
      return;
    }

    setLoadingState(true);
    setStatus('Updating your password…', 'info');

    // No backend is connected yet. We intentionally avoid any fake
    // "Password updated!" message, since no actual update is taking
    // place. This simulated delay only demonstrates the loading state
    // UX until Supabase Auth is wired in.
    //
    // TODO (future integration):
    // Only call this AFTER confirming a valid recovery session exists
    // (see checkRecoverySession() above):
    //
    // const { data, error } = await supabase.auth.updateUser({
    //   password: fields.newPassword.value,
    // });
    //
    // if (error) {
    //   setStatus(error.message, 'error');
    // } else {
    //   setStatus('Your password has been updated. You can now log in.', 'success');
    //   // Optionally redirect to login.html after a short delay.
    // }
    window.setTimeout(() => {
      setLoadingState(false);
      setStatus(
        'Password update is not yet connected to our backend. No password has been changed. Please check back soon.',
        'info'
      );
    }, 1200);
  });

  function validateNewPassword() {
    const value = fields.newPassword.value;

    if (value.length === 0) {
      showError('newPassword', 'Please enter a new password.');
      return false;
    }
    if (!isPasswordValid(value)) {
      showError('newPassword', 'Please meet all password requirements listed above.');
      return false;
    }
    clearError('newPassword');
    return true;
  }

  function validateConfirmPassword() {
    const value = fields.confirmNewPassword.value;

    if (value.length === 0) {
      showError('confirmNewPassword', 'Please confirm your new password.');
      return false;
    }
    if (value !== fields.newPassword.value) {
      showError('confirmNewPassword', 'Passwords do not match.');
      return false;
    }
    clearError('confirmNewPassword');
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
    statusEl.classList.remove('status-error', 'status-info', 'status-success');
    if (type) statusEl.classList.add(`status-${type}`);
  }

  function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    btnText.textContent = isLoading ? 'Updating…' : 'Update Password';
    btnSpinner.hidden = !isLoading;
  }
}

/* --------------------------------------------------------------------------
   Scroll Reveal Animation (consistent with other auth pages)
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
