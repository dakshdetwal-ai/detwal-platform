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
  rows.forEach(r=>{const card=document.createElement('article');card.className='plan-request';const top=document.createElement('div');top.className='plan-request-top';const title=document.createElement('div'),h=document.createElement('h3'),d=document.createElement('p'),s=document.createElement('span'),m=document.createElement('p');h.textContent=String(r.plan_id).toUpperCase();d.textContent='Submitted '+new Date(r.created_at).toLocaleDateString('en-IN');title.append(h,d);s.className='request-status status-'+r.status;s.textContent=({pending:'Pending verification',approved:'Approved',rejected:'Rejected'})[r.status]||r.status;top.append(title,s);m.className='plan-request-meta';m.textContent='₹'+Number(r.amount_inr).toLocaleString('en-IN');card.append(top,m);host.append(card);});
 }catch(e){console.error(e);host.innerHTML='<div class="dashboard-empty"><strong>Could not load account history</strong><p>Please refresh or contact support.</p></div>';}
});