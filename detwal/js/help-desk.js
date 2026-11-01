document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),client=window.detwalSupabase;
 const y=$('year');if(y)y.textContent=new Date().getFullYear();
 if(!client){location.replace('login.html?next=help-desk');return;}
 const {data,error}=await client.auth.getSession();if(error||!data.session){location.replace('login.html?next=help-desk');return;}
 const user=data.session.user;$('helpName').value=user.user_metadata?.full_name||user.user_metadata?.name||'';$('helpEmail').value=user.email||'';$('helpEmail').readOnly=true;
 const status=document.createElement('p');status.setAttribute('role','status');$('helpForm').append(status);
 $('helpForm').addEventListener('submit',async e=>{e.preventDefault();const subject=$('helpSubject').value.trim(),message=$('helpMessage').value.trim();const button=$('helpForm').querySelector('[type="submit"]');if(subject.length<3||message.length<5){status.textContent='Please enter a subject and message.';return;}button.disabled=true;try{
  const {data:id,error}=await client.rpc('create_support_ticket',{p_subject:subject,p_message:message});if(error)throw error;
  status.textContent='Your support ticket was submitted successfully. Ticket ID: '+id;$('helpMessage').value='';$('helpSubject').value='';
 }catch(err){status.textContent='Could not submit ticket. '+err.message;}finally{button.disabled=false;}});
});