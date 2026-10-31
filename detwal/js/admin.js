document.addEventListener('DOMContentLoaded', async () => {
 const $=id=>document.getElementById(id), client=window.detwalSupabase;
 const notice=$('notice');
 if(!client){notice.textContent='Authentication library unavailable.';return;}
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session){notice.textContent='Please sign in with your administrator account.';return;}
 const headers=async()=>{const {data:{session:s}}=await client.auth.getSession();if(!s)throw Error('Session expired. Sign in again.');return {Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'};};
 const api=async(path,opts={})=>{const h=await headers();const res=await fetch('https://detwal-api.dakshdetwal10.workers.dev'+path,{...opts,headers:{...h,...opts.headers}});const d=await res.json();if(!res.ok)throw Error(d.message||'Request failed');return d;};
 async function load(){
  notice.textContent='Verifying admin permission…';
  try{
   const d=await api('/admin/overview');
   $('adminApp').classList.remove('hidden');notice.textContent='Administrator access verified.';
   $('usersCount').textContent=d.metrics.users;$('paidCount').textContent=d.metrics.paidSubscriptions;
   $('pendingCount').textContent=d.metrics.pendingPayments;$('ticketsCount').textContent=d.metrics.openTickets;
   $('paymentsTable').innerHTML=table(d.payments,['created_at','customer_name','email','plan_id','amount_inr','utr_reference','status'],true);
   $('customersTable').innerHTML=table(d.users,['email','full_name','created_at','subscription','account_status'],false);
   $('ticketsList').replaceChildren();
   (d.tickets||[]).forEach(t=>{
    const el=document.createElement('article');el.className='ticket';
    const title=document.createElement('h3');title.textContent=t.subject+' · '+t.status;
    const meta=document.createElement('p');meta.className='muted';meta.textContent=t.email+' · '+new Date(t.created_at).toLocaleString();
    const msg=document.createElement('p');msg.textContent=t.message;
    const reply=document.createElement('textarea');reply.className='reply';reply.placeholder='Write a reply…';
    const send=document.createElement('button');send.className='primary';send.textContent='Send reply';
    send.onclick=async()=>{send.disabled=true;try{await api('/admin/tickets/'+encodeURIComponent(t.id)+'/reply',{method:'POST',body:JSON.stringify({reply:reply.value})});reply.value='';await load();}catch(e){alert(e.message);send.disabled=false;}};
    el.append(title,meta,msg,reply,send);$('ticketsList').append(el);
   });
  }catch(e){$('adminApp').classList.add('hidden');notice.textContent='Admin API not ready or access denied: '+e.message;}
 }
 function table(rows,cols,actions){
  if(!rows?.length)return '<p class="muted">No records found.</p>';
  const esc=v=>String(v??'—').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  return '<table><thead><tr>'+cols.map(c=>'<th>'+esc(c.replaceAll('_',' '))+'</th>').join('')+(actions?'<th>Action</th>':'<th>Restriction</th>')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(r[c])+'</td>').join('')+(actions?'<td><button class="primary" data-payment="'+esc(r.id)+'" data-status="approved">Approve</button><button class="danger" data-payment="'+esc(r.id)+'" data-status="rejected">Reject</button></td>':'<td><button class="danger" data-user="'+esc(r.id)+'">Restrict</button></td>')+'</tr>').join('')+'</tbody></table>';
 }
 document.addEventListener('click',async e=>{
  const p=e.target.closest('[data-payment]');if(p){try{await api('/admin/payments/'+encodeURIComponent(p.dataset.payment),{method:'PATCH',body:JSON.stringify({status:p.dataset.status})});await load();}catch(x){alert(x.message);}}
  const u=e.target.closest('[data-user]');if(u){const duration=prompt('Restriction duration in hours (e.g. 24). Enter 0 to block indefinitely:');if(duration===null||!/^\d+$/.test(duration))return;const reason=prompt('Reason for restriction:')||'Admin restriction';try{await api('/admin/users/'+encodeURIComponent(u.dataset.user)+'/restrict',{method:'POST',body:JSON.stringify({hours:Number(duration),reason})});await load();}catch(x){alert(x.message);}}
 });
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));['payments','customers','tickets'].forEach(id=>$(id).classList.toggle('hidden',id!==b.dataset.tab));});
 $('refresh').onclick=load;await load();
});