document.addEventListener('DOMContentLoaded', async () => {
 const client=window.detwalSupabase;
 if(client){try{const {data:{session}}=await client.auth.getSession();const email=document.getElementById('accountEmail');if(email)email.textContent=session?.user?.email||'Your account';}catch(e){console.warn('Account status unavailable',e);}}
 const logout=document.getElementById('logoutButton');if(logout)logout.addEventListener('click',async()=>{if(client)await client.auth.signOut();location.assign('login.html');});
 const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
});