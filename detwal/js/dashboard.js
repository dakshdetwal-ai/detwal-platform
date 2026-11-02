document.addEventListener('DOMContentLoaded',async()=>{
 const client=window.detwalSupabase,$=id=>document.getElementById(id);$('year').textContent=new Date().getFullYear();
 if(!client){location.replace('login.html?next=dashboard');return;}
 const {data,error}=await client.auth.getSession();if(error||!data.session){location.replace('login.html?next=dashboard');return;}
 const user=data.session.user,meta=user.user_metadata||{},name=meta.full_name||meta.name||'Trader';
 $('welcomeName').textContent=name.split(' ')[0];$('fullName').textContent=name;$('emailAddress').textContent=user.email||'—';$('mobileNumber').textContent=meta.phone_number||'Not added yet';$('joinedDate').textContent=user.created_at?new Date(user.created_at).toLocaleDateString('en-IN'):'—';
 const host=$('planRequests');
 try{
  const [rq,sq]=await Promise.all([
   client.from('payment_requests').select('id,plan_id,amount_inr,status,created_at,customer_name,mobile_number').eq('user_id',user.id).order('created_at',{ascending:false}),
   client.from('subscriptions').select('id,plan_id,status,starts_at,expires_at,terminals_limit').eq('user_id',user.id).order('expires_at',{ascending:false})
  ]);
  if(rq.error)throw rq.error;if(sq.error)throw sq.error;
  const rows=rq.data||[],subs=sq.data||[],now=Date.now(),active=subs.find(s=>s.status==='active'&&new Date(s.expires_at).getTime()>now);
  $('requestCount').textContent=rows.length;$('approvedCount').textContent=rows.filter(r=>r.status==='approved').length;$('pendingCount').textContent=rows.filter(r=>r.status==='pending').length;
  if(active){const banner=document.createElement('div');banner.className='dashboard-empty';const days=Math.max(0,Math.ceil((new Date(active.expires_at).getTime()-now)/86400000));banner.innerHTML='<strong>Active subscription: '+String(active.plan_id).toUpperCase()+'</strong><p>Access expiry: '+new Date(active.expires_at).toLocaleString('en-IN')+' · '+days+' day(s) remaining · '+active.terminals_limit+' terminal(s)</p>';host.append(banner);}
  if(!rows.length&&!active){host.innerHTML='<div class="dashboard-empty"><strong>No plan requests yet</strong><p>Your plan requests will appear here.</p><a class="btn btn-primary" href="store.html">Browse plans</a></div>';return;}

  const [inv,notifs,code,rewards]=await Promise.all([
   client.from('invoices').select('invoice_number,plan_id,amount_inr,issued_at').eq('user_id',user.id).order('issued_at',{ascending:false}),
   client.from('customer_notifications').select('id,kind,title,body,created_at,read_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30),
   client.rpc('detwal_create_referral_code'),
   client.from('referral_rewards').select('amount_inr,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false})
  ]);
  if(inv.error)throw inv.error;if(notifs.error)throw notifs.error;if(code.error)throw code.error;if(rewards.error)throw rewards.error;
  $('invoiceList').replaceChildren();
  (inv.data||[]).forEach(v=>{const c=document.createElement('article');c.className='plan-request';const title=document.createElement('strong');title.textContent=v.invoice_number+' · '+String(v.plan_id).toUpperCase();const meta=document.createElement('p');meta.textContent='₹'+Number(v.amount_inr).toLocaleString('en-IN')+' · '+new Date(v.issued_at).toLocaleDateString('en-IN');const print=document.createElement('button');print.className='btn btn-ghost';print.textContent='Print receipt';print.onclick=()=>{const w=window.open('','_blank','width=600,height=700');if(!w)return;w.document.write('<h1>DETwal payment receipt</h1><p>Invoice: '+v.invoice_number+'</p><p>Plan: '+v.plan_id+'</p><p>Amount: ₹'+v.amount_inr+'</p><p>Issued: '+new Date(v.issued_at).toLocaleString()+'</p>');w.document.close();w.print();};c.append(title,meta,print);$('invoiceList').append(c);});
  if(!(inv.data||[]).length)$('invoiceList').textContent='No receipts yet.';
  let activeReferralCode=code.data||'';
  const showReferralCode=value=>{activeReferralCode=value||'';$('referralCode').textContent=activeReferralCode||'Not created yet';$('copyReferral').disabled=!activeReferralCode;const link=activeReferralCode?new URL('signup.html?ref='+encodeURIComponent(activeReferralCode),location.href).href:'';$('referralLink').value=link;};
  showReferralCode(activeReferralCode);
  $('generateReferral').textContent=activeReferralCode?'Get my referral code':'Generate my referral code';
  $('generateReferral').onclick=async()=>{const btn=$('generateReferral');btn.disabled=true;btn.textContent='Creating…';try{const {data,error}=await client.rpc('detwal_create_referral_code');if(error)throw error;showReferralCode(data);btn.textContent='My referral code is ready';}catch(e){$('referralStatus').textContent=e.message||'Could not create referral code.';btn.textContent='Try again';}finally{btn.disabled=false;}};
  $('copyReferral').onclick=()=>activeReferralCode&&navigator.clipboard?.writeText(activeReferralCode);
  $('copyReferralLink').onclick=()=>navigator.clipboard?.writeText($('referralLink').value);
  const incoming=new URLSearchParams(location.search).get('ref')||meta.referral_code||'';
  if(incoming){$('referralInput').value=incoming.toUpperCase();if(meta.referral_code){const {error:autoError}=await client.rpc('detwal_apply_referral',{p_code:incoming.toUpperCase()});$('referralStatus').textContent=autoError?autoError.message:'Your inviter’s referral code has been applied.';}}
  $('applyReferralForm').onsubmit=async e=>{e.preventDefault();const {data:applied,error}=await client.rpc('detwal_apply_referral',{p_code:$('referralInput').value.trim().toUpperCase()});$('referralStatus').textContent=error?error.message:'Referral code applied successfully.';};
  $('referralRewards').textContent=(rewards.data||[]).map(r=>'₹'+r.amount_inr+' · '+r.status).join(' | ')||'No referral rewards yet.';
  $('notificationList').replaceChildren();
  (notifs.data||[]).forEach(n=>{const c=document.createElement('article');c.className='plan-request';const t=document.createElement('strong');t.textContent=n.title;const p=document.createElement('p');p.textContent=n.body+' · '+new Date(n.created_at).toLocaleString('en-IN');c.append(t,p);$('notificationList').append(c);});
  if(!(notifs.data||[]).length)$('notificationList').textContent='No notifications yet.';
  rows.forEach(r=>{const card=document.createElement('article');card.className='plan-request';const top=document.createElement('div');top.className='plan-request-top';const title=document.createElement('div'),h=document.createElement('h3'),d=document.createElement('p'),s=document.createElement('span'),m=document.createElement('p');h.textContent=String(r.plan_id).toUpperCase();d.textContent='Submitted '+new Date(r.created_at).toLocaleDateString('en-IN');title.append(h,d);s.className='request-status status-'+r.status;s.textContent=({pending:'Pending verification',approved:'Approved',rejected:'Rejected'})[r.status]||r.status;top.append(title,s);m.className='plan-request-meta';m.textContent='₹'+Number(r.amount_inr).toLocaleString('en-IN');card.append(top,m);host.append(card);});
 }catch(e){console.error(e);host.innerHTML='<div class="dashboard-empty"><strong>Could not load account history</strong><p>Please refresh or contact support.</p></div>';}
});