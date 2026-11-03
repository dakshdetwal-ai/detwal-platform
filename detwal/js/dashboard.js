document.addEventListener('DOMContentLoaded', async () => {
  const client = window.detwalSupabase;
  const $ = id => document.getElementById(id);
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const setMessage = (id, message, isError = false) => {
    const el = $(id);
    if (!el) return;
    el.replaceChildren();
    const p = document.createElement('p');
    p.className = isError ? 'dashboard-error' : 'dashboard-muted';
    p.textContent = message;
    el.append(p);
  };

  setText('year', new Date().getFullYear());
  if (!client) {
    location.replace('login.html?next=dashboard');
    return;
  }

  let session;
  try {
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    session = result.data.session;
  } catch (error) {
    console.error('DETwal dashboard: session lookup failed', error);
    location.replace('login.html?next=dashboard');
    return;
  }
  if (!session) {
    location.replace('login.html?next=dashboard');
    return;
  }

  const user = session.user;
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || 'Trader';
  setText('welcomeName', name.split(' ')[0]);
  setText('fullName', name);
  setText('emailAddress', user.email || '—');
  setText('mobileNumber', meta.phone_number || 'Not added yet');
  setText('joinedDate', user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '—');

  // Load each dashboard panel independently. A failure in one table/RPC must
  // never leave the other panels stuck on their initial "Loading…" messages.
  async function loadPlanHistory() {
    const host = $('planRequests');
    try {
      const [rq, sq] = await Promise.all([
        client.from('payment_requests')
          .select('id,plan_id,amount_inr,status,created_at,customer_name,mobile_number')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
        client.from('subscriptions')
          .select('id,plan_id,status,starts_at,expires_at,terminals_limit')
          .eq('user_id', user.id).order('expires_at', { ascending: false })
      ]);
      if (rq.error) throw rq.error;
      if (sq.error) throw sq.error;

      const rows = rq.data || [];
      const subs = sq.data || [];
      const now = Date.now();
      const active = subs.find(s => s.status === 'active' && new Date(s.expires_at).getTime() > now);
      setText('requestCount', rows.length);
      setText('approvedCount', rows.filter(r => r.status === 'approved').length);
      setText('pendingCount', rows.filter(r => r.status === 'pending').length);
      host.replaceChildren();

      if (active) {
        const banner = document.createElement('div');
        banner.className = 'dashboard-empty';
        const days = Math.max(0, Math.ceil((new Date(active.expires_at).getTime() - now) / 86400000));
        const title = document.createElement('strong');
        title.textContent = 'Active subscription: ' + String(active.plan_id).toUpperCase();
        const detail = document.createElement('p');
        detail.textContent = 'Access expiry: ' + new Date(active.expires_at).toLocaleString('en-IN') +
          ' · ' + days + ' day(s) remaining · ' + active.terminals_limit + ' terminal(s)';
        banner.append(title, detail);
        host.append(banner);
      }

      if (!rows.length && !active) {
        const empty = document.createElement('div');
        empty.className = 'dashboard-empty';
        const title = document.createElement('strong');
        title.textContent = 'No plan requests yet';
        const detail = document.createElement('p');
        detail.textContent = 'Your plan requests will appear here.';
        const link = document.createElement('a');
        link.className = 'btn btn-primary';
        link.href = 'store.html';
        link.textContent = 'Browse plans';
        empty.append(title, detail, link);
        host.append(empty);
      }

      rows.forEach(r => {
        const card = document.createElement('article');
        card.className = 'plan-request';
        const top = document.createElement('div');
        top.className = 'plan-request-top';
        const title = document.createElement('div');
        const heading = document.createElement('h3');
        heading.textContent = String(r.plan_id).toUpperCase();
        const date = document.createElement('p');
        date.textContent = 'Submitted ' + new Date(r.created_at).toLocaleDateString('en-IN');
        title.append(heading, date);
        const status = document.createElement('span');
        status.className = 'request-status status-' + String(r.status).toLowerCase();
        status.textContent = ({ pending: 'Pending verification', approved: 'Approved', rejected: 'Rejected' })[r.status] || r.status;
        top.append(title, status);
        const amount = document.createElement('p');
        amount.className = 'plan-request-meta';
        amount.textContent = '₹' + Number(r.amount_inr).toLocaleString('en-IN');
        card.append(top, amount);
        host.append(card);
      });
    } catch (error) {
      console.error('DETwal dashboard: plan history failed', error);
      setMessage('planRequests', 'Could not load plan history. Please refresh this section later.', true);
    }
  }

  async function loadInvoices() {
    const host = $('invoiceList');
    try {
      const { data, error } = await client.from('invoices')
        .select('invoice_number,plan_id,amount_inr,issued_at')
        .eq('user_id', user.id).order('issued_at', { ascending: false });
      if (error) throw error;
      host.replaceChildren();
      (data || []).forEach(invoice => {
        const card = document.createElement('article');
        card.className = 'plan-request';
        const title = document.createElement('strong');
        title.textContent = String(invoice.invoice_number) + ' · ' + String(invoice.plan_id).toUpperCase();
        const detail = document.createElement('p');
        detail.textContent = '₹' + Number(invoice.amount_inr).toLocaleString('en-IN') +
          ' · ' + new Date(invoice.issued_at).toLocaleDateString('en-IN');
        const print = document.createElement('button');
        print.type = 'button';
        print.className = 'btn btn-ghost';
        print.textContent = 'Print receipt';
        print.addEventListener('click', () => {
          const win = window.open('', '_blank', 'width=600,height=700');
          if (!win) return;
          const doc = win.document;
          const heading = doc.createElement('h1');
          heading.textContent = 'DETwal payment receipt';
          doc.body.append(heading);
          [
            ['Invoice', invoice.invoice_number],
            ['Plan', invoice.plan_id],
            ['Amount', '₹' + Number(invoice.amount_inr).toLocaleString('en-IN')],
            ['Issued', new Date(invoice.issued_at).toLocaleString('en-IN')]
          ].forEach(([label, value]) => {
            const p = doc.createElement('p');
            p.textContent = label + ': ' + String(value ?? '');
            doc.body.append(p);
          });
          win.print();
        });
        card.append(title, detail, print);
        host.append(card);
      });
      if (!(data || []).length) host.textContent = 'No receipts yet.';
    } catch (error) {
      console.error('DETwal dashboard: invoices failed', error);
      setMessage('invoiceList', 'Invoices could not be loaded. Please refresh or contact support.', true);
    }
  }

  async function loadReferral() {
    try {
      const [codeResult, rewardsResult] = await Promise.all([
        client.rpc('detwal_create_referral_code'),
        client.from('referral_rewards').select('amount_inr,status,created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      if (codeResult.error) throw codeResult.error;
      if (rewardsResult.error) throw rewardsResult.error;

      let activeReferralCode = codeResult.data || '';
      const showReferralCode = value => {
        activeReferralCode = value || '';
        setText('referralCode', activeReferralCode || 'Not created yet');
        $('copyReferral').disabled = !activeReferralCode;
        $('referralLink').value = activeReferralCode
          ? new URL('signup.html?ref=' + encodeURIComponent(activeReferralCode), location.href).href
          : '';
      };
      showReferralCode(activeReferralCode);
      $('generateReferral').textContent = activeReferralCode ? 'Get my referral code' : 'Generate my referral code';
      $('generateReferral').onclick = async () => {
        const button = $('generateReferral');
        button.disabled = true;
        button.textContent = 'Creating…';
        try {
          const result = await client.rpc('detwal_create_referral_code');
          if (result.error) throw result.error;
          showReferralCode(result.data);
          button.textContent = 'My referral code is ready';
        } catch (error) {
          console.error('DETwal dashboard: referral code generation failed', error);
          setText('referralStatus', error.message || 'Could not create referral code.');
          button.textContent = 'Try again';
        } finally {
          button.disabled = false;
        }
      };
      $('copyReferral').onclick = async () => {
        if (!activeReferralCode) return;
        try { await navigator.clipboard.writeText(activeReferralCode); setText('referralStatus', 'Referral code copied.'); }
        catch (error) { setText('referralStatus', 'Copy failed. Please copy the code manually.'); }
      };
      $('copyReferralLink').onclick = async () => {
        try { await navigator.clipboard.writeText($('referralLink').value); setText('referralStatus', 'Referral link copied.'); }
        catch (error) { setText('referralStatus', 'Copy failed. Please copy the link manually.'); }
      };

      const incoming = new URLSearchParams(location.search).get('ref') || meta.referral_code || '';
      if (incoming) {
        $('referralInput').value = incoming.toUpperCase();
        if (meta.referral_code) {
          const result = await client.rpc('detwal_apply_referral', { p_code: incoming.toUpperCase() });
          setText('referralStatus', result.error ? result.error.message : 'Your inviter’s referral code has been applied.');
        }
      }
      $('applyReferralForm').onsubmit = async event => {
        event.preventDefault();
        const button = $('applyReferralForm').querySelector('button[type="submit"]');
        button.disabled = true;
        try {
          const result = await client.rpc('detwal_apply_referral', {
            p_code: $('referralInput').value.trim().toUpperCase()
          });
          if (result.error) throw result.error;
          setText('referralStatus', 'Referral code applied successfully.');
        } catch (error) {
          setText('referralStatus', error.message || 'Could not apply referral code.');
        } finally {
          button.disabled = false;
        }
      };
      const rewards = rewardsResult.data || [];
      setText('referralRewards', rewards.map(r => '₹' + r.amount_inr + ' · ' + r.status).join(' | ') || 'No referral rewards yet.');
    } catch (error) {
      console.error('DETwal dashboard: referral data failed', error);
      setText('referralCode', 'Could not load referral code');
      setText('referralRewards', 'Referral rewards could not be loaded. Please refresh later.');
      setText('referralStatus', error.message || 'Referral service is temporarily unavailable.');
    }
  }

  async function loadNotifications() {
    const host = $('notificationList');
    try {
      const { data, error } = await client.from('customer_notifications')
        .select('id,kind,title,body,created_at,read_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      host.replaceChildren();
      (data || []).forEach(notification => {
        const card = document.createElement('article');
        card.className = 'plan-request';
        const title = document.createElement('strong');
        title.textContent = notification.title;
        const detail = document.createElement('p');
        detail.textContent = notification.body + ' · ' + new Date(notification.created_at).toLocaleString('en-IN');
        card.append(title, detail);
        host.append(card);
      });
      if (!(data || []).length) host.textContent = 'No notifications yet.';
    } catch (error) {
      console.error('DETwal dashboard: notifications failed', error);
      setMessage('notificationList', 'Notifications could not be loaded. Please refresh later.', true);
    }
  }

  await Promise.allSettled([loadPlanHistory(), loadInvoices(), loadReferral(), loadNotifications()]);
});