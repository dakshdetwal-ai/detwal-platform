document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),client=window.detwalSupabase;
 const y=$('year');if(y)y.textContent=new Date().getFullYear();
 if(!client){location.replace('login.html?next=help-desk');return;}
 const {data,error}=await client.auth.getSession();if(error||!data.session){location.replace('login.html?next=help-desk');return;}
 const user=data.session.user;$('helpName').value=user.user_metadata?.full_name||user.user_metadata?.name||'';$('helpEmail').value=user.email||'';$('helpEmail').readOnly=true;
 const status=document.createElement('p');status.setAttribute('role','status');$('helpForm').append(status);
 const show=m=>status.textContent=m;
 $('helpForm').addEventListener('submit',async e=>{e.preventDefault();const subject=$('helpSubject').value.trim(),message=$('helpMessage').value.trim();if(subject.length<3||message.length<5){show('Please enter a subject and message.');return;}const button=$('helpForm').querySelector('[type="submit"]');button.disabled=true;try{
  const {data:t,error:te}=await client.from('support_tickets').insert({user_id:user.id,subject}).select().single();if(te)throw te;
  const {error:me}=await client.from('support_messages').insert({ticket_id:t.id,sender_id:user.id,message,is_admin:false});if(me)throw me;
  show('Your support ticket was submitted. Ticket ID: '+t.id);$('helpMessage').value='';$('helpSubject').value='';
 }catch(err){show('Could not submit ticket. Please try again. '+err.message);}finally{button.disabled=false;}});
});