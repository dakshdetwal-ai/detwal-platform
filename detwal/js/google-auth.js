/* DETwal Google OAuth. Requires Google provider enabled in Supabase Auth. */
document.addEventListener('DOMContentLoaded', () => {
  const client = window.detwalSupabase;
  const button = document.getElementById('googleSignIn');
  const status = document.getElementById('formStatus');
  const setStatus = (message, type = 'info') => {
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status status-' + type;
  };

  if (!client) {
    if (button) button.disabled = true;
    console.error('DETwal Supabase client is unavailable for Google sign-in.');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error_description') || params.get('error');
  if (oauthError) {
    setStatus('Google sign-in failed: ' + oauthError.replace(/\+/g, ' '), 'error');
  }

  // Supabase exchanges the OAuth PKCE code from the callback URL when the client starts.
  if (params.get('oauth') === 'google') {
    setStatus('Finishing Google sign-in…');
    client.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.session) throw new Error('Google did not return an active session. Please try again.');
      const referral = (params.get('ref') || '').trim().toUpperCase();
      if (referral) {
        const current = data.session.user.user_metadata || {};
        const { error: profileError } = await client.auth.updateUser({
          data: { ...current, referral_code: referral }
        });
        if (profileError) console.warn('Referral code could not be attached to Google profile:', profileError);
      }
      const email = (data.session.user.email || '').toLowerCase();
      if (email === 'dakshdetwal10@gmail.com') {
        window.location.replace('admin.html');
      } else {
        window.location.replace('store.html');
      }
    }).catch(error => {
      console.error('DETwal Google OAuth callback failed:', error);
      setStatus(error.message || 'Google sign-in could not be completed. Please try again.', 'error');
    });
  }

  if (!button) return;
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.querySelector('span').textContent = 'Connecting to Google…';
    setStatus('Redirecting to Google securely…');
    try {
      let referral = '';
      const input = document.getElementById('referralCode');
      referral = (input?.value || params.get('ref') || '').trim().toUpperCase();
      const callback = new URL('https://detwal.in/detwal/login.html');
      callback.searchParams.set('oauth', 'google');
      if (referral) callback.searchParams.set('ref', referral);
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: 'select_account' }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('DETwal Google sign-in start failed:', error);
      setStatus(error.message || 'Could not start Google sign-in. Please try again.', 'error');
      button.disabled = false;
      button.querySelector('span').textContent = 'Continue with Google';
    }
  });
});
