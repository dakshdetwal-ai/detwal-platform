document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  if (!client) { location.replace('login.html?next=store'); return; }
  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) { location.replace('login.html?next=store'); return; }
    const email = document.getElementById('accountEmail');
    if (email) email.textContent = session.user.email || 'Signed in';
    document.getElementById('logoutButton').addEventListener('click', async () => {
      const { error: logoutError } = await client.auth.signOut();
      if (logoutError) { alert('Could not log out. Please try again.'); return; }
      location.replace('login.html');
    });
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  } catch (error) {
    console.error('Store session check failed:', error);
    location.replace('login.html?next=store');
  }
});