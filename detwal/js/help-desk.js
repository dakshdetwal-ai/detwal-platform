document.addEventListener('DOMContentLoaded', async () => {
 const $=id=>document.getElementById(id);
 $('year').textContent=new Date().getFullYear();
 const client=window.detwalSupabase;
 if(client){
   try{
     const {data:{session}}=await client.auth.getSession();
     if(session){
       $('helpName').value=session.user.user_metadata?.full_name||session.user.user_metadata?.name||'';
       $('helpEmail').value=session.user.email||'';
     }
   }catch(error){console.warn('Could not prefill help form:',error);}
 }
 $('helpForm').addEventListener('submit',event=>{
   event.preventDefault();
   const name=$('helpName').value.trim();
   const email=$('helpEmail').value.trim();
   const subject=$('helpSubject').value;
   const message=$('helpMessage').value.trim();
   if(!name||!email||!subject||!message)return;
   const body=['Hello DETwal Support,','', 'Name: '+name,'Email: '+email,'Subject: '+subject,'Query: '+message].join('\n');
   const url='https://wa.me/916375064184?text='+encodeURIComponent(body);
   window.location.href=url;
 });
});