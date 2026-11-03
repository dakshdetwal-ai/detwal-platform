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
      // Do not leave the panel spinning indefinitely if the network stalls.
      const invoiceRequest = client.from('invoices')
        .select('invoice_number,plan_id,amount_inr,issued_at')
        .eq('user_id', user.id).order('issued_at', { ascending: false });
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Invoice request timed out. Please try again.')), 10000)
      );
      const { data, error } = await Promise.race([invoiceRequest, timeout]);
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
          const win = window.open('', '_blank', 'width=820,height=900');
          if (!win) {
            setText('invoiceList', 'Please allow pop-ups to print or save your receipt.');
            return;
          }
          const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
          })[char]);
          const money = Number(invoice.amount_inr).toLocaleString('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 2
          });
          const issued = new Date(invoice.issued_at);
          const issuedDate = issued.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
          const issuedTime = issued.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const customerName = meta.full_name || meta.name || 'Customer';
          const customerEmail = user.email || '—';
          const customerPhone = meta.phone_number || 'Not provided';
          const doc = win.document;
          doc.open();
          doc.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt ${escapeHtml(invoice.invoice_number)} — DETwal</title>
<style>
*{box-sizing:border-box}body{margin:0;padding:36px;background:#eef1f8;color:#20243a;font-family:Inter,Arial,sans-serif}
.receipt{max-width:760px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 18px 55px rgba(31,38,75,.13)}
.banner{padding:34px 42px;background:linear-gradient(120deg,#25134f,#6534c7 58%,#9b65f5);color:#fff;display:flex;justify-content:space-between;gap:20px;align-items:center}
.brand{font-size:28px;font-weight:800;letter-spacing:-1px}.brand span{color:#d6c1ff}.tag{font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.8;margin-top:5px}
.stamp{border:1px solid rgba(255,255,255,.45);border-radius:30px;padding:9px 15px;font-size:11px;font-weight:700;letter-spacing:1px;white-space:nowrap}
.content{padding:36px 42px}.heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:28px}
h1{font-size:26px;margin:0 0 7px;color:#211b36}.muted{color:#777b90;font-size:13px;line-height:1.6}
.invoice-no{text-align:right;font-size:12px;color:#777b90}.invoice-no strong{display:block;color:#34245f;font-size:15px;margin-top:5px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0}
.panel{background:#f7f5fc;border:1px solid #ece7f7;border-radius:13px;padding:18px}
.label{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#858096;margin-bottom:9px}
.value{font-size:14px;font-weight:650;color:#2a2540;line-height:1.7;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse;margin-top:22px}th{text-align:left;background:#f3effb;color:#63537e;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:13px}
td{padding:17px 13px;border-bottom:1px solid #eeeaf4;font-size:13px}td:last-child,th:last-child{text-align:right}
.total{margin:20px 0 0 auto;max-width:300px;background:#f4efff;border-radius:14px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center}
.total span{font-size:12px;color:#66577e;font-weight:700}.total strong{font-size:22px;color:#5b2bb7}
.note{margin-top:28px;padding:16px 18px;border-left:4px solid #8b55e8;background:#faf8ff;color:#6d6880;font-size:12px;line-height:1.7}
.footer{padding:20px 42px;background:#faf9fd;border-top:1px solid #eeeaf4;text-align:center;color:#888397;font-size:11px;line-height:1.7}
.actions{text-align:center;margin:20px auto 0}.actions button{border:0;border-radius:30px;padding:12px 24px;background:#713bd1;color:white;font-weight:700;font-size:13px;cursor:pointer}
@media(max-width:600px){body{padding:12px}.banner,.content{padding:24px 20px}.footer{padding:18px 20px}.grid{grid-template-columns:1fr}.heading{flex-direction:column}.invoice-no{text-align:left}}
@media print{body{padding:0;background:#fff}.receipt{box-shadow:none;border-radius:0;max-width:none}.actions{display:none}.banner{-webkit-print-color-adjust:exact;print-color-adjust:exact}.panel,.total,.note,.footer,th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<article class="receipt">
<header class="banner"><div><div class="brand">DET<span>wal</span></div><div class="tag">Official payment receipt</div></div><div class="stamp">RECEIPT ISSUED</div></header>
<main class="content">
<div class="heading"><div><h1>Payment receipt</h1><div class="muted">Thank you for choosing DETwal.</div></div><div class="invoice-no">RECEIPT NUMBER<strong>${escapeHtml(invoice.invoice_number)}</strong></div></div>
<div class="grid">
<section class="panel"><div class="label">Billed to</div><div class="value">${escapeHtml(customerName)}</div><div class="muted">${escapeHtml(customerEmail)}<br>Phone: ${escapeHtml(customerPhone)}</div></section>
<section class="panel"><div class="label">Receipt details</div><div class="value">Issue date: ${escapeHtml(issuedDate)}</div><div class="muted">Time: ${escapeHtml(issuedTime)}<br>Currency: Indian Rupee (INR)</div></section>
</div>
<div class="label">Purchase summary</div>
<table><thead><tr><th>Description</th><th>Plan</th><th>Amount</th></tr></thead>
<tbody><tr><td>TopG Algo access</td><td>${escapeHtml(String(invoice.plan_id).toUpperCase())}</td><td>${escapeHtml(money)}</td></tr></tbody></table>
<div class="total"><span>TOTAL AMOUNT</span><strong>${escapeHtml(money)}</strong></div>
<div class="note"><strong>Important:</strong> This receipt records the invoice details available in your DETwal account. Any tax breakdown, payment method, transaction reference or billing address not shown here was not available in the invoice record. Please retain this receipt for your records.</div>
</main>
<footer class="footer">DETwal · Automated trading technology<br>This receipt is generated electronically. No physical signature is required.</footer>
</article>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`);
          doc.close();
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