document.addEventListener('DOMContentLoaded', async () => {
 const $=id=>document.getElementById(id);
 const year=$('year');if(year)year.textContent=new Date().getFullYear();
 const client=window.detwalSupabase;
 if(!client){location.replace('login.html?next=help-desk');return;}
 const {data,error}=await client.auth.getSession();
 if(error||!data.session){location.replace('login.html?next=help-desk');return;}
 const user=data.session.user;
 $('helpName').value=user.user_metadata?.full_name||user.user_metadata?.name||'';
 $('helpEmail').value=user.email||'';$('helpEmail').readOnly=true;
 $('helpForm').addEventListener('submit',event=>{
  event.preventDefault();
  const subject=$('helpSubject').value,message=$('helpMessage').value.trim();
  if(!subject||!message)return;
  const body=encodeURIComponent('DETwal Support Request\nName: '+$('helpName').value.trim()+'\nEmail: '+user.email+'\nSubject: '+subject+'\n\n'+message);
  window.open('https://wa.me/916375064184?text='+body,'_blank','noopener');
 });
});