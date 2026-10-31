document.addEventListener('DOMContentLoaded', async () => {
 const $=id=>document.getElementById(id);
 $('year').textContent=new Date().getFullYear();
 const client=window.detwalSupabase;
 if(!client){$('helpForm').addEventListener('submit',e=>{e.preventDefault();alert('Please refresh and sign in first.');});return;}
 let session;
 try{const {data,error}=await client.auth.getSession();if(error)throw error;session=data.session;}catch(e){console.error(e);}
 if(!session){location.replace('login.html?next=help-desk');return;}
 $('helpName').value=session.user.user_metadata?.full_name||session.user.user_metadata?.name||'';
 $('helpEmail').value=session.user.email||'';
 $('helpEmail').readOnly=true;
 $('helpForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=$('helpForm').querySelector('button[type="submit"]');
  const subject=$('helpSubject').value,message=$('helpMessage').value.trim();
  if(!subject||!message)return;
  button.disabled=true;button.textContent='Submitting…';
  try{
   const {data:{session:current}}=await client.auth.getSession();
   const response=await fetch('https://detwal-api.dakshdetwal10.workers.dev/support/tickets',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:current.user.email,name:$('helpName').value.trim(),subject,message})
   });
   const result=await response.json();if(!response.ok)throw Error(result.message||'Ticket submission failed');
   $('helpForm').reset();$('helpName').value=session.user.user_metadata?.full_name||session.user.user_metadata?.name||'';
   $('helpEmail').value=session.user.email||'';
   alert('Your support ticket was submitted. Ticket ID: '+result.ticketId);
  }catch(error){alert('Could not submit ticket: '+error.message);}
  finally{button.disabled=false;button.textContent='Submit support ticket';}
 });
});