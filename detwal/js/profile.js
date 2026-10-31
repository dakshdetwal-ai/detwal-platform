document.addEventListener('DOMContentLoaded', async () => {
 const client=window.detwalSupabase;
 const byId=id=>document.getElementById(id);
 const year=byId('year'); if(year)year.textContent=new Date().getFullYear();
 const {data:{session},error}=await client.auth.getSession();
 if(error||!session){location.replace('login.html?next=profile');return;}
 const user=session.user, meta=user.user_metadata||{};
 byId('profileEmail').textContent=user.email||'';
 byId('fullName').value=meta.full_name||meta.name||'';
 byId('phone').value=meta.phone_number||'';
 byId('detailsForm').addEventListener('submit',async e=>{
  e.preventDefault(); const name=byId('fullName').value.trim(),phone=byId('phone').value.trim(),status=byId('detailsStatus');
  if(name.length<2){status.textContent='Please enter your full name.';return;}
  if(!/^[6-9][0-9]{9}$/.test(phone)){status.textContent='Enter a valid 10-digit Indian mobile number.';return;}
  status.textContent='Saving…';
  const {error}=await client.auth.updateUser({data:{...user.user_metadata,full_name:name,phone_number:phone}});
  status.textContent=error?(error.message||'Could not save details.'):'Profile details updated.';
  if(!error)byId('fullName').value=name;
 });
 byId('passwordForm').addEventListener('submit',async e=>{
  e.preventDefault();const password=byId('newPassword').value,confirm=byId('confirmPassword').value,status=byId('passwordStatus');
  if(password.length<8){status.textContent='Use at least 8 characters.';return;}
  if(password!==confirm){status.textContent='Passwords do not match.';return;}
  status.textContent='Updating password…';
  const {error}=await client.auth.updateUser({password});
  status.textContent=error?(error.message||'Could not update password.'):'Password updated successfully.';
  if(!error)byId('passwordForm').reset();
 });
});