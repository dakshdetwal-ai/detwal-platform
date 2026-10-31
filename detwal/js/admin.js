document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const API = 'https://detwal-api.dakshdetwal10.workers.dev';
  const token = sessionStorage.getItem('detwal_admin_token');

  if (!token) {
    location.replace('login.html');
    return;
  }

  const notice = message => { $('notice').textContent = message; };
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);

  async function api(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('detwal_admin_token');
      sessionStorage.removeItem('detwal_admin_email');
      location.replace('login.html');
      throw new Error('Admin session expired. Please log in again.');
    }
    if (!response.ok || data.success === false) {
      const detail = data.detail ? ' — ' + data.detail : '';
      throw new Error((data.message || 'Backend request failed: ' + path) + detail);
    }
    return data;
  }

  function renderTable(id, rows, columns) {
    const target = $(id);
    if (!Array.isArray(rows) || rows.length === 0) {
      target.innerHTML = '<div class="empty-note">No records found.</div>';
      return;
    }
    target.innerHTML = '<table><thead><tr>' +
      columns.map(column => '<th>' + column[0] + '</th>').join('') +
      '</tr></thead><tbody>' +
      rows.map(row => '<tr>' + columns.map(column => '<td>' + column[1](row) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table>';
  }

  const action = (label, type, table, id) =>
    '<button data-act="' + type + '" data-table="' + esc(table) + '" data-id="' + esc(id) + '">' + label + '</button>';

  let users = [];

  async function loadPayments() {
    const result = await api('/admin/requests');
    const requests = result.requests || {};
    const rows = [];
    Object.entries(requests).forEach(([tableName, records]) => {
      (Array.isArray(records) ? records : []).forEach(record => rows.push({ ...record, _table: tableName }));
    });
    renderTable('paymentsTable', rows, [
      ['Source', row => esc(row._table)],
      ['Customer / Email', row => esc(row.customer_name || row.user_email || row.email || row.name)],
      ['Plan / Type', row => esc(row.plan_id || row.plan || row.type)],
      ['Amount', row => row.amount_inr == null ? '—' : '₹' + esc(row.amount_inr)],
      ['Reference', row => esc(row.utr_reference || row.reference || row.id)],
      ['Status', row => esc(row.status)],
      ['Update', row => row.id == null || !row.status ? '—' :
        action('Approve','status-approved',row._table,row.id) +
        action('Reject','status-rejected',row._table,row.id)]
    ]);
    notice('Showing records currently stored in the Cloudflare D1 request tables.');
  }

  async function loadCustomers() {
    const result = await api('/admin/users');
    users = Array.isArray(result.users) ? result.users : [];
    renderUsers(users);
  }

  function renderUsers(rows) {
    renderTable('customersTable', rows, [
      ['Name', row => esc(row.name || row.full_name || row.customer_name)],
      ['Email', row => esc(row.email || row.user_email)],
      ['Phone', row => esc(row.phone || row.mobile_number)],
      ['Joined', row => esc(row.created_at)],
      ['Subscription', row => esc(row.plan || row.subscription || row.plan_id || 'None')],
      ['Status', row => esc(row.status || row.account_status)],
      ['Actions', row => {
        const email = row.email || row.user_email;
        return email ? action('Restrict','restrict', '', email) + action('Unrestrict','unrestrict','',email) : '—';
      }]
    ]);
  }

  async function loadTickets() {
    const result = await api('/admin/tickets');
    const tickets = Array.isArray(result.tickets) ? result.tickets : [];
    const messages = Array.isArray(result.messages) ? result.messages : [];
    const host = $('ticketsList');
    host.replaceChildren();

    if (!tickets.length) {
      host.innerHTML = '<div class="empty-note">No support tickets found.</div>';
      return;
    }

    tickets.forEach(ticket => {
      const card = document.createElement('article');
      card.className = 'ticket';
      const title = document.createElement('h3');
      title.textContent = '#' + ticket.id + ' · ' + (ticket.subject || 'Support request') + ' · ' + (ticket.status || 'open');
      const meta = document.createElement('p');
      meta.className = 'muted';
      meta.textContent = (ticket.user_email || 'Unknown customer') + ' · ' + (ticket.created_at || '');
      const message = document.createElement('p');
      message.textContent = ticket.message || '';
      card.append(title, meta, message);

      const thread = messages.filter(item => String(item.ticket_id) === String(ticket.id));
      thread.forEach(item => {
        const reply = document.createElement('p');
        reply.textContent = (item.sender || 'reply') + ': ' + (item.message || '');
        card.append(reply);
      });

      const input = document.createElement('textarea');
      input.placeholder = 'Write a reply…';
      const send = document.createElement('button');
      send.className = 'primary';
      send.textContent = 'Send reply';
      send.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) { notice('Write a reply first.'); return; }
        send.disabled = true;
        try {
          await api('/admin/tickets/reply', {
            method: 'POST',
            body: JSON.stringify({ ticketId: ticket.id, message: text })
          });
          input.value = '';
          notice('Reply saved successfully.');
          await loadTickets();
        } catch (error) {
          notice(error.message);
        } finally {
          send.disabled = false;
        }
      });
      card.append(input, send);
      host.append(card);
    });
  }

  async function load(tab) {
    try {
      if (tab === 'payments') await loadPayments();
      if (tab === 'customers') await loadCustomers();
      if (tab === 'tickets') await loadTickets();
      if (tab === 'plans') {
        $('plansTable').innerHTML = '<div class="empty-note">Plans API is not implemented in the Worker yet.</div>';
        notice('Subscription plan management needs backend routes and a confirmed plans table.');
      }
      if (tab === 'coupons') {
        $('couponsTable').innerHTML = '<div class="empty-note">Coupons API is not implemented in the Worker yet.</div>';
        notice('Coupon management needs backend routes and a confirmed coupon schema.');
      }
      if (tab === 'activity') {
        $('activityTable').innerHTML = '<div class="empty-note">No bot activity endpoint is configured yet.</div>';
        notice('Bot activity is read-only and will appear once its data source is connected.');
      }
    } catch (error) {
      notice(error.message);
    }
  }

  async function overview() {
    try {
      const result = await api('/admin/overview');
      const counts = result.counts || {};
      $('usersCount').textContent = counts.users ?? '—';
      $('paidCount').textContent = counts.subscription_orders ?? '—';
      $('pendingCount').textContent =
        (counts.account_requests ?? 0) +
        (counts.news_payment_requests ?? 0) +
        (counts.orders ?? 0) +
        (counts.subscription_orders ?? 0);
      $('ticketsCount').textContent = counts.support_tickets ?? '—';
      $('botsCount').textContent = '—';
      $('adminApp').classList.remove('hidden');
      notice('Admin authenticated · live counts received from Cloudflare D1.');
    } catch (error) {
      notice(error.message);
    }
  }

  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
      ['payments','customers','tickets','plans','coupons','activity'].forEach(id =>
        $(id).classList.toggle('hidden', id !== button.dataset.tab)
      );
      load(button.dataset.tab);
    });
  });

  document.body.addEventListener('click', async event => {
    const button = event.target.closest('[data-act]');
    if (!button) return;
    const type = button.dataset.act;
    const id = button.dataset.id;
    const tableName = button.dataset.table;

    try {
      if (type === 'status-approved' || type === 'status-rejected') {
        await api('/admin/request-status', {
          method: 'PATCH',
          body: JSON.stringify({
            table: tableName,
            id,
            status: type === 'status-approved' ? 'approved' : 'rejected'
          })
        });
        notice('Request status updated.');
        await loadPayments();
      }

      if (type === 'restrict') {
        const hours = Number(prompt('Restrict this user for how many hours? (1–8760)'));
        if (!Number.isFinite(hours) || hours < 1 || hours > 8760) return;
        await api('/admin/users/restrict', {
          method: 'POST',
          body: JSON.stringify({ email: id, hours, reason: 'Admin restriction' })
        });
        notice('User restriction saved.');
        await loadCustomers();
      }

      if (type === 'unrestrict') {
        await api('/admin/users/unrestrict', {
          method: 'POST',
          body: JSON.stringify({ email: id })
        });
        notice('User restriction removed.');
        await loadCustomers();
      }
    } catch (error) {
      notice(error.message);
    }
  });

  $('userSearch').addEventListener('input', () => {
    const query = $('userSearch').value.toLowerCase();
    renderUsers(users.filter(user =>
      [user.name,user.full_name,user.email,user.user_email,user.phone,user.mobile_number]
        .some(value => String(value || '').toLowerCase().includes(query))
    ));
  });

  // Do not leave controls that look active when their backend routes do not exist yet.
  ['newPlan','savePlan','newCoupon','saveCoupon'].forEach(id => {
    const control = $(id);
    if (control) {
      control.disabled = true;
      control.title = 'This feature needs its backend routes before it can be used.';
    }
  });

  $('globalSearch').addEventListener('input', () => {
    const query = $('globalSearch').value.trim().toLowerCase();
    const active = document.querySelector('[data-tab].active')?.dataset.tab;
    if (active === 'customers') {
      renderUsers(users.filter(user =>
        [user.name,user.full_name,user.email,user.user_email,user.phone,user.mobile_number]
          .some(value => String(value || '').toLowerCase().includes(query))
      ));
    } else if (active === 'tickets') {
      $('ticketsList').querySelectorAll('.ticket').forEach(card => {
        card.hidden = query && !card.textContent.toLowerCase().includes(query);
      });
    } else if (active === 'payments') {
      $('paymentsTable').querySelectorAll('tbody tr').forEach(row => {
        row.hidden = query && !row.textContent.toLowerCase().includes(query);
      });
    }
  });

  $('refresh').addEventListener('click', async () => {
    await overview();
    const active = document.querySelector('[data-tab].active')?.dataset.tab || 'payments';
    await load(active);
  });

  overview();
  document.querySelector('[data-tab="payments"]').click();
});