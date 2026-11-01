document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('testingApplication');
  if (!form) return;
  const button = document.getElementById('submitApplication');
  const message = document.getElementById('formMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.className = 'form-message';
    message.textContent = '';

    if (!form.reportValidity()) return;
    if (form.elements.website.value.trim()) return;

    const rawPhone = form.elements.whatsapp_number.value.trim();
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      message.className = 'form-message error';
      message.textContent = 'Please enter a valid WhatsApp number with country code.';
      form.elements.whatsapp_number.focus();
      return;
    }

    if (!window.detwalSupabase) {
      message.className = 'form-message error';
      message.textContent = 'The application service is unavailable right now. Please try again shortly.';
      return;
    }

    const payload = {
      full_name: form.elements.full_name.value.trim(),
      whatsapp_number: rawPhone,
      strategy_experience: form.elements.strategy_experience.value,
      received_payout: form.elements.received_payout.value === 'yes',
      strongest_level: form.elements.strongest_level.value
    };

    button.disabled = true;
    button.textContent = 'Submitting…';
    try {
      const { error } = await window.detwalSupabase
        .from('topg_free_testing_applications')
        .insert(payload);
      if (error) throw error;

      form.reset();
      message.className = 'form-message success';
      message.textContent = 'Application submitted successfully! If you’re selected among the 3 traders, we’ll contact you on WhatsApp. Thank you.';
    } catch (error) {
      console.error('TopG testing application error:', error);
      message.className = 'form-message error';
      message.textContent = 'We couldn’t submit your application. Please check your details and try again.';
    } finally {
      button.disabled = false;
      button.textContent = 'Submit application';
    }
  });
});