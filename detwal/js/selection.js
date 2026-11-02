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
    const phone=String(r.whatsapp_number||'');let digits=phone.replace(/\D/g,'');if(digits.length===10)digits='91'+digits;const valid=digits.length>=11&&digits.length<=15;
    const send=valid?'<a class="open" style="margin:0 6px 8px 0" href="https://wa.me/'+digits+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener noreferrer">Send on WhatsApp ↗</a>':'<span class="muted">No valid WhatsApp number recorded</span>';
    return '<article class="person"><strong>'+esc(name)+'</strong><div class="details">'+esc(r.strategy_experience)+' · Payout: '+(r.received_payout?'Yes':'No')+' · '+esc(r.strongest_level)+'<br>WhatsApp: '+esc(phone||'Not provided')+'</div>'+send+'<a class="open" href="#'+id+'">Preview message</a><section class="message" id="'+id+'"><div class="muted">WhatsApp message preview</div><p>'+esc(msg)+'</p></section></article>';
   }).join(''):'<p class="muted">No traders in this group.</p>';
  }
  render(yes,'qualified','yes');render(no,'notQualified','no');
  $('app').classList.remove('hidden');note('Loaded '+rows.length+' applications. Duplicate names are shown once. WhatsApp opens with a prefilled draft; press Send in WhatsApp to deliver it.');
 }catch(e){note(e.message,true);}
});