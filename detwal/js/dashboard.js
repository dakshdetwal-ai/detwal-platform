document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  const $ = id => document.getElementById(id);
  $('year').textContent = new Date().getFullYear();
  if (!client) { location.replace('login.html?next=dashboard'); return; }

  let session;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
  } catch (error) {
    console.error('Dashboard session error:', error);
  }
  if (!session) { location.replace('login.html?next=dashboard'); return; }

  const user = session.user;
  const metadata = user.user_metadata || {};
  const name = metadata.full_name || metadata.name || 'Trader';
  $('welcomeName').textContent = name.split(' ')[0];
  $('fullName').textContent = name;
  $('emailAddress').textContent = user.email || '—';
  $('mobileNumber').textContent = metadata.phone_number || 'Not added yet';
  $('joinedDate').textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—';

  const plans = {
    basic: {name:'Basic',term:'Monthly',terminals:'1 MT5 terminal'},
    pro: {name:'Pro',term:'Monthly',terminals:'Up to 2 MT5 terminals'},
    premium: {name:'Premium',term:'Monthly',terminals:'Up to 4 MT5 terminals'},
    trial: {name:'7-day Basic trial',term:'7 days',terminals:'1 MT5 terminal'}
  };
  const statusLabel = {pending:'Pending verification',approved:'Approved',rejected:'Rejected'};
  const host = $('planRequests');
  try {
    const { data: requests, error } = await client.from('payment_requests')
      .select('id,plan_id,amount_inr,status,created_at,customer_name,mobile_number')
      .eq('user_id', user.id).order('created_at', {ascending:false});
    if (error) throw error;
    const rows = requests || [];
    $('requestCount').textContent = rows.length;
    $('approvedCount').textContent = rows.filter(r=>r.status==='approved').length;
    $('pendingCount').textContent = rows.filter(r=>r.status==='pending').length;
    if (!metadata.phone_number && rows.length) $('mobileNumber').textContent = rows[0].mobile_number || 'Not added yet';
    if ((!metadata.full_name && !metadata.name) && rows.length) {
      $('fullName').textContent = rows[0].customer_name || 'Not added yet';
      $('welcomeName').textContent = (rows[0].customer_name || 'Trader').split(' ')[0];
    }
    if (!rows.length) {
      host.innerHTML = '<div class="dashboard-empty"><strong>No plan requests yet</strong><p>Your TopG Algo purchases and trial requests will appear here.</p><a class="btn btn-primary" href="store.html">Browse plans</a></div>';
      return;
    }
    host.replaceChildren();
    rows.forEach(request => {
      const plan = plans[request.plan_id] || {name:request.plan_id,term:'',terminals:''};
      const card = document.createElement('article');
      card.className = 'plan-request';
      const top = document.createElement('div'); top.className='plan-request-top';
      const title = document.createElement('div');
      const heading = document.createElement('h3'); heading.textContent=plan.name;
      const date = document.createElement('p'); date.textContent='Submitted '+new Date(request.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
      title.append(heading,date);
      const status = document.createElement('span'); status.className='request-status status-'+request.status; status.textContent=statusLabel[request.status]||request.status;
      top.append(title,status);
      const meta = document.createElement('p'); meta.className='plan-request-meta';
      meta.textContent=plan.terminals+' · ₹'+Number(request.amount_inr).toLocaleString('en-IN');
      card.append(top,meta);
      host.append(card);
    });
  } catch (error) {
    console.error('Could not load payment requests:', error);
    host.innerHTML = '<div class="dashboard-empty"><strong>Could not load plan history</strong><p>Make sure the payment_requests table is set up in Supabase. Refresh and try again.</p></div>';
    $('requestCount').textContent='—'; $('approvedCount').textContent='—'; $('pendingCount').textContent='—';
  }
});