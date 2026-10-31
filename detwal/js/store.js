document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  if (!client) { location.replace('login.html?next=store'); return; }
  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) { location.replace('login.html?next=store'); return; }
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  } catch (error) {
    console.error('Store session check failed:', error);
    location.replace('login.html?next=store');
  }
});
