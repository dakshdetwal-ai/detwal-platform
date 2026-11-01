document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),client=window.detwalSupabase,status=$('formStatus'),form=$('paymentForm'),submit=$('submitPayment'),select=$('plan');
 const setStatus=(m,t='info')=>{status.textContent=m;status.className='form-status status-'+t;};
 if(!client){setStatus('Secure sign-in could not load. Refresh and try again.','error');submit.disabled=true;return;}
 const {data:{session},error:se}=await client.auth.getSession();if(se||!session){location.replace('login.html?next=store');return;}
 const {data:catalog,error:pe}=await client.from('plans').select('id,name,amount_inr,duration_days,terminals_limit').eq('is_active',true).order('amount_inr');
 if(pe||!catalog?.length){setStatus('Plans are temporarily unavailable. Please contact support.','error');submit.disabled=true;return;}
 const plans=Object.fromEntries(catalog.map(p=>[p.id,p]));
 const requested=new URLSearchParams(location.search).get('plan');
 select.replaceChildren(...catalog.map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' — ₹'+Number(p.amount_inr).toLocaleString('en-IN')+(p.duration_days===30?' / month':' / '+p.duration_days+' days');return o;}));
 if(plans[requested])select.value=requested;
 const refresh=()=>{const p=plans[select.value];$('amount').textContent='₹'+Number(p.amount_inr).toLocaleString('en-IN');$('planLabel').textContent=p.name+' · '+p.duration_days+' days';$('openUpi').dataset.amount=String(p.amount_inr);};
 select.addEventListener('change',refresh);refresh();
 $('customerName').value=session.user.user_metadata?.full_name||'';
 $('copyUpi').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('dakshdetwal@fam');$('copyUpi').textContent='Copied';}catch{setStatus('Copy unavailable. Copy dakshdetwal@fam manually.','error');}});
 $('openUpi').addEventListener('click',()=>{const p=plans[select.value],note=encodeURIComponent('DETwal '+select.value.toUpperCase()+' '+session.user.id.slice(0,8));location.href='upi://pay?pa=dakshdetwal@fam&pn=DETwal&am='+p.amount_inr+'&cu=INR&tn='+note;});
 const modal=$('infoModal'),close=()=>modal.hidden=true;$('upiInfo').addEventListener('click',()=>modal.hidden=false);$('closeInfo').addEventListener('click',close);$('understood').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close();});
 form.addEventListener('submit',async e=>{e.preventDefault();const name=$('customerName').value.trim(),mobile=$('mobile').value.trim(),payer=$('payerUpi').value.trim(),utr=$('utr').value.trim(),plan=select.value,p=plans[plan];
  if(!name||!/^[6-9][0-9]{9}$/.test(mobile)||!payer.includes('@')||utr.length<8){setStatus('Check your name, mobile, payer UPI ID and UTR.','error');return;}
  submit.disabled=true;submit.textContent='Submitting…';try{
   const {error}=await client.from('payment_requests').insert({user_id:session.user.id,customer_name:name,mobile_number:mobile,plan_id:plan,payer_upi_id:payer,amount_inr:p.amount_inr,utr_reference:utr,status:'pending'});if(error)throw error;
   setStatus('Payment request submitted and awaiting manual verification.','success');form.reset();$('customerName').value=name;select.value=plan;refresh();
  }catch(err){setStatus(err.message.includes('duplicate')?'This UTR has already been submitted.':err.message,'error');}
  finally{submit.disabled=false;submit.textContent='I have paid — submit for verification';}
 });
 const y=$('year');if(y)y.textContent=new Date().getFullYear();
});