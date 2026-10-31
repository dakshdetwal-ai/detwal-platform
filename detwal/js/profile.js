document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  const byId = id => document.getElementById(id);
  const year = byId('year');
  if (year) year.textContent = new Date().getFullYear();

  if (!client) {
    console.error('DETwal Supabase client is unavailable.');
    const status = byId('passwordStatus');
    if (status) status.textContent = 'Account service could not load. Refresh the page and try again.';
    return;
  }

  let session;
  try {
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    session = result.data.session;
  } catch (error) {
    console.error('Session check failed:', error);
  }
  if (!session) {
    location.replace('login.html?next=profile');
    return;
  }

  const user = session.user;
  const meta = user.user_metadata || {};
  byId('profileEmail').textContent = user.email || '';
  byId('fullName').value = meta.full_name || meta.name || '';
  byId('phone').value = meta.phone_number || '';

  byId('detailsForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = byId('fullName').value.trim();
    const phone = byId('phone').value.trim();
    const status = byId('detailsStatus');
    const button = event.currentTarget.querySelector('button[type="submit"]');
    if (name.length < 2) { status.textContent = 'Please enter your full name.'; return; }
    if (!/^[6-9][0-9]{9}$/.test(phone)) { status.textContent = 'Enter a valid 10-digit Indian mobile number.'; return; }
    button.disabled = true;
    status.textContent = 'Saving…';
    try {
      const { error } = await client.auth.updateUser({ data: { ...user.user_metadata, full_name: name, phone_number: phone } });
      if (error) throw error;
      status.textContent = 'Profile details updated.';
    } catch (error) {
      console.error('Profile update failed:', error);
      status.textContent = error.message || 'Could not save details. Please try again.';
    } finally {
      button.disabled = false;
    }
  });

  byId('passwordForm').addEventListener('submit', async event => {
    event.preventDefault();
    const current = byId('currentPassword').value;
    const password = byId('newPassword').value;
    const confirm = byId('confirmPassword').value;
    const status = byId('passwordStatus');
    const button = event.currentTarget.querySelector('button[type="submit"]');
    if (password.length < 8) { status.textContent = 'Use at least 8 characters.'; return; }
    if (password !== confirm) { status.textContent = 'New passwords do not match.'; return; }
    if (password === current) { status.textContent = 'Your new password must be different from the current password.'; return; }

    button.disabled = true;
    status.textContent = 'Verifying current password…';
    try {
      const { error: signInError } = await client.auth.signInWithPassword({
        email: user.email,
        password: current
      });
      if (signInError) throw new Error('Current password is incorrect. Please check it and try again.');

      status.textContent = 'Updating password…';
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) throw updateError;

      status.textContent = 'Password changed successfully.';
      byId('passwordForm').reset();
    } catch (error) {
      console.error('Password change failed:', error);
      status.textContent = error.message || 'Could not update password. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
});