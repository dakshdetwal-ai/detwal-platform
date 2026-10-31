document.addEventListener('DOMContentLoaded', async () => {
  const client=window.detwalSupabase;
  const status=document.getElementById('formStatus');
  const form=document.getElementById('paymentForm');
  const submit=document.getElementById('submitPayment');
  const plans={
    basic:{label:'Basic monthly plan',amount:799},
    pro:{label:'Pro monthly plan',amount:1399},
    premium:{label:'Premium monthly plan',amount:2499},
    trial:{label:'7-day Basic trial',amount:299}
  };
  const params=new URLSearchParams(location.search);
  const select=document.getElementById('plan');
  if(plans[params.get('plan')]) select.value=params.get('plan');
  const refreshAmount=()=>{
    const p=plans[select.value];
    document.getElementById('amount').textContent='₹'+p.amount.toLocaleString('en-IN');
    document.getElementById('planLabel').textContent=p.label;
    document.getElementById('openUpi').dataset.amount=String(p.amount);
  };
  select.addEventListener('change',refreshAmount);refreshAmount();
  const setStatus=(msg,type='info')=>{status.textContent=msg;status.className='form-status status-'+type;};
  if(!client){setStatus('Secure sign-in could not load. Please refresh and try again.','error');submit.disabled=true;return;}
  const {data:{session},error:sessionError}=await client.auth.getSession();
  if(sessionError||!session){location.replace('login.html?next=store');return;}
  const profileName=session.user.user_metadata?.full_name||'';
  document.getElementById('customerName').value=profileName;
  document.getElementById('copyUpi').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText('dakshdetwal@fam');document.getElementById('copyUpi').textContent='Copied';}
    catch{setStatus('Copy unavailable. Please copy dakshdetwal@fam manually.','error');}
  });
  document.getElementById('openUpi').addEventListener('click',()=>{
    const p=plans[select.value];
    const note=encodeURIComponent('DETwal '+select.value.toUpperCase()+' '+session.user.id.slice(0,8));
    const uri='upi://pay?pa=dakshdetwal@fam&pn=DETwal&am='+p.amount+'&cu=INR&tn='+note;
    location.href=uri;
  });
  const modal=document.getElementById('infoModal');
  const close=()=>{modal.hidden=true;};
  document.getElementById('upiInfo').addEventListener('click',()=>{modal.hidden=false;});
  document.getElementById('closeInfo').addEventListener('click',close);
  document.getElementById('understood').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const name=document.getElementById('customerName').value.trim();
    const mobile=document.getElementById('mobile').value.trim();
    const payerUpi=document.getElementById('payerUpi').value.trim();
    const utr=document.getElementById('utr').value.trim();
    const plan=select.value;
    if(!name||!/^[6-9][0-9]{9}$/.test(mobile)||!payerUpi.includes('@')||utr.length<8){setStatus('Please check your name, 10-digit mobile number, payer UPI ID and UTR.','error');return;}
    submit.disabled=true;submit.textContent='Submitting request…';
    try{
      const {error}=await client.from('payment_requests').insert({
        user_id:session.user.id,customer_name:name,mobile_number:mobile,
        plan_id:plan,payer_upi_id:payerUpi,amount_inr:plans[plan].amount,
        utr_reference:utr,status:'pending'
      });
      if(error)throw error;
      setStatus('Payment request submitted. Status: PENDING VERIFICATION. Your access will be activated only after the payment is confirmed.','success');
      form.reset();document.getElementById('customerName').value=profileName;select.value=plan;refreshAmount();
    }catch(err){
      console.error(err);
      setStatus(err.message?.includes('payment_requests')?'Payment request storage is not configured yet. Please contact DETwal support.':'Could not submit your request. Please try again or contact support.','error');
    }finally{submit.disabled=false;submit.textContent='I have paid — submit for verification';}
  });
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
});