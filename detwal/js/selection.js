document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),client=window.detwalSupabase,ADMIN='dakshdetwal10@gmail.com',BASE='https://evsnwenvmwhrohyzrjgq.supabase.co/functions/v1/admin-api';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const note=(s,bad=false)=>{$('notice').textContent=s;$('notice').className='notice'+(bad?' error':'');};
 try{
  const {data,error}=await Promise.race([client.auth.getSession(),new Promise((_,rej)=>setTimeout(()=>rej(Error('Session check timed out. Sign in again.')),10000))]);
  if(error||!data.session||(data.session.user.email||'').toLowerCase()!==ADMIN)throw Error('Admin access required. Please sign in through the DETwal admin console first.');
  const res=await fetch(BASE+'/testing-applications',{headers:{'apikey':'sb_publishable_Vfy2VLbqRYB_DOsK13iuqA_9-pk4Q5t','Authorization':'Bearer '+data.session.access_token}});
  const body=await res.json();if(!res.ok||body.success===false)throw Error(body.message||'Could not load applications.');
  const rows=body.applications||[];$('total').textContent=rows.length;
  const qualifies=r=>String(r.strategy_experience||'').toLowerCase().includes('more than 1 year')&&r.received_payout===true&&String(r.strongest_level||'').toUpperCase()==='QML';
  const unique=[];const seen=new Set();rows.forEach(r=>{const key=(r.full_name||'').trim().toLowerCase();if(!seen.has(key)){seen.add(key);unique.push(r);}});
  const yes=unique.filter(qualifies),no=unique.filter(r=>!qualifies(r));$('qualifiedCount').textContent=yes.length;$('otherCount').textContent=no.length;
  function render(list,target,kind){
   $(target).innerHTML=list.length?list.map((r,i)=>{
    const id='msg-'+kind+'-'+i,name=String(r.full_name||'Trader').trim(),msg=kind==='yes'?'Hey '+name+', you have been selected! Please visit detwal.in and create your account. We will activate your account by tomorrow’s London session.':'Hey '+name+', sorry to say, but you have not been selected among the 3 traders for TopG Algo free access. However, we’d love you to visit detwal.in and stay tuned for our next slot of 50 traders, coming this weekend.';
    return '<article class="person"><strong>'+esc(name)+'</strong><div class="details">'+esc(r.strategy_experience)+' · Payout: '+(r.received_payout?'Yes':'No')+' · '+esc(r.strongest_level)+'</div><a class="open" href="#'+id+'">Open message ↗</a><section class="message" id="'+id+'"><div class="muted">Ready-to-send WhatsApp message</div><p id="text-'+id+'">'+esc(msg)+'</p><button class="copy" data-copy="'+id+'">Copy message</button></section></article>';
   }).join(''):'<p class="muted">No traders in this group.</p>';
  }
  render(yes,'qualified','yes');render(no,'notQualified','no');
  document.addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;const p=document.querySelector('#text-'+b.dataset.copy);try{await navigator.clipboard.writeText(p.textContent);b.textContent='Copied!';}catch{note('Copy unavailable. Select the paragraph and copy it manually.',true);}});
  $('app').classList.remove('hidden');note('Loaded '+rows.length+' applications. Duplicate names are shown once.');
 }catch(e){note(e.message,true);}
});