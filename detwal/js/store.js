document.addEventListener('DOMContentLoaded', async () => {
 const client=window.detwalSupabase;
 if(!client){location.replace('login.html?next=store');return;}
 try{
  const {data:{session},error}=await client.auth.getSession();if(error||!session){location.replace('login.html?next=store');return;}
  const email=document.getElementById('accountEmail');if(email)email.textContent=session.user.email||'Your account';
  const {data:plans,error:pe}=await client.from('plans').select('id,name,amount_inr,duration_days,terminals_limit').eq('is_active',true);
  if(pe)throw pe;
  const cards=[...document.querySelectorAll('.store-card')];
  cards.forEach(card=>{
   const title=card.querySelector('h3')?.textContent.trim().toLowerCase();
   const p=(plans||[]).find(x=>x.name.toLowerCase()===title||x.id===title);
   if(!p)return;
   const price=card.querySelector('.store-price');if(price)price.innerHTML='₹'+Number(p.amount_inr).toLocaleString('en-IN')+' <span>/ '+p.duration_days+' days</span>';
   const label=card.querySelector('.plan-label');if(label)label.textContent=p.name+' · '+p.terminals_limit+' terminal(s)';
   const link=card.querySelector('.plan-button');if(link)link.href='payment.html?plan='+encodeURIComponent(p.id);
  });
  const trial=(plans||[]).find(p=>p.id==='trial'),trialLink=document.querySelector('.intro-offer .btn');
  if(trial&&trialLink){trialLink.href='payment.html?plan=trial';const price=document.querySelector('.intro-offer .offer-price');if(price)price.innerHTML='₹'+Number(trial.amount_inr).toLocaleString('en-IN')+' <span>one-time trial entry</span>';}
 }catch(e){console.error('Store catalogue load failed:',e);}
 const logout=document.getElementById('logoutButton');if(logout)logout.addEventListener('click',async()=>{await client.auth.signOut();location.assign('login.html');});
 const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
});