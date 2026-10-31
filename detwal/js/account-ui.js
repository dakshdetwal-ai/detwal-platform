/* Shared DETwal account navigation. Load after supabase-client.js. */
document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  const host = document.querySelector('.nav-actions, .auth-header-nav, .store-nav') ||
    document.querySelector('.site-header .nav-container');
  if (!host || !client) return;
  let session = null;
  try {
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    session = result.data.session;
  } catch (error) {
    console.error('Could not read DETwal session:', error);
    return;
  }

  if (!session) return; // Keep the existing Login / Sign Up links for visitors.

  host.querySelectorAll('a, button, span').forEach(el => el.remove());
  host.classList.add('account-nav');
  const user = session.user;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'My account';
  const initial = (name.trim()[0] || user.email?.[0] || 'D').toUpperCase();
  const wrap = document.createElement('div');
  wrap.className = 'account-menu-wrap';
  wrap.innerHTML = `
    <button class="account-avatar" type="button" aria-label="Open account menu" aria-expanded="false">${initial}</button>
    <div class="account-dropdown" hidden>
      <div class="account-dropdown-user"><strong></strong><small></small></div>
      <a href="profile.html">My Profile</a>
      <a href="forgot-password.html">Forgot password?</a>
      <button type="button" class="account-signout">Log out</button>
    </div>`;
  wrap.querySelector('.account-dropdown-user strong').textContent = name;
  wrap.querySelector('.account-dropdown-user small').textContent = user.email || '';
  const toggle = wrap.querySelector('.account-avatar');
  const menu = wrap.querySelector('.account-dropdown');
  toggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', event => {
    if (!wrap.contains(event.target)) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  wrap.querySelector('.account-signout').addEventListener('click', async () => {
    const button = wrap.querySelector('.account-signout');
    button.disabled = true;
    const { error } = await client.auth.signOut();
    if (error) {
      button.disabled = false;
      alert('Could not log out. Please try again.');
      return;
    }
    window.location.assign('login.html');
  });
  host.appendChild(wrap);
});
