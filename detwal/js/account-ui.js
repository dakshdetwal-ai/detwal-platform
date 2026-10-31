/* Shared DETwal account navigation. Load after supabase-client.js. */
document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  const host = document.querySelector('.nav-actions, .auth-header-nav, .store-nav') ||
    (() => {
      const nav = document.querySelector('.site-header .nav-container');
      if (!nav) return null;
      const el = document.createElement('div');
      el.className = 'nav-actions';
      nav.appendChild(el);
      return el;
    })();
  if (!host || !client) return;

  let session;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
  } catch (error) {
    console.error('Could not read DETwal session:', error);
    return;
  }
  if (!session) return;

  host.querySelectorAll('a, button, span').forEach(el => el.remove());
  host.classList.add('account-nav');

  const user = session.user;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || 'My account';
  const initial = (name.trim()[0] || user.email?.[0] || 'D').toUpperCase();
  const wrap = document.createElement('div');
  wrap.className = 'account-menu-wrap';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'account-avatar';
  toggle.setAttribute('aria-label', 'Open account menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = initial;
  wrap.appendChild(toggle);
  host.appendChild(wrap);

  // Render the menu at document level so mobile navigation cannot clip it.
  const menu = document.createElement('div');
  menu.className = 'account-dropdown';
  menu.hidden = true;
  menu.innerHTML = '<div class="account-dropdown-user"><strong></strong><small></small></div><a href="profile.html">My Profile</a><a href="forgot-password.html">Forgot password?</a><button type="button" class="account-signout">Log out</button>';
  menu.querySelector('.account-dropdown-user strong').textContent = name;
  menu.querySelector('.account-dropdown-user small').textContent = user.email || '';
  menu.style.position = 'fixed';
  menu.style.zIndex = '10000';
  document.body.appendChild(menu);

  const positionMenu = () => {
    const rect = toggle.getBoundingClientRect();
    menu.style.top = Math.min(window.innerHeight - 16, rect.bottom + 10) + 'px';
    menu.style.right = Math.max(12, window.innerWidth - rect.right) + 'px';
    menu.style.left = 'auto';
  };
  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', event => {
    event.stopPropagation();
    if (menu.hidden) {
      positionMenu();
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    } else closeMenu();
  });
  document.addEventListener('click', event => {
    if (!wrap.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  window.addEventListener('resize', () => { if (!menu.hidden) positionMenu(); });
  window.addEventListener('scroll', () => { if (!menu.hidden) positionMenu(); }, true);

  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  menu.querySelector('.account-signout').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    const { error } = await client.auth.signOut();
    if (error) {
      button.disabled = false;
      alert('Could not log out. Please try again.');
      return;
    }
    window.location.assign('login.html');
  });
});
