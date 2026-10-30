document.addEventListener('DOMContentLoaded', async () => {
  const client=window.detwalSupabase;
  const form=document.getElementById('resetPasswordForm');
  const notice=document.getElementById('sessionNotice');
  const status=document.getElementById('formStatus');
  const button=document.getElementById('resetSubmit');
  const newPassword=document.getElementById('newPassword');
  const confirmPassword=document.getElementById('confirmNewPassword');
  let recoverySession=false;
  let recoveryEventSeen=false;
  const setStatus=(message,type='info')=>{status.textContent=message;status.className='form-status status-'+type;};
  document.querySelectorAll('.toggle-password').forEach(toggle=>toggle.addEventListener('click',()=>{
    const input=document.getElementById(toggle.dataset.target);if(!input)return;
    input.type=input.type==='password'?'text':'password';
    toggle.setAttribute('aria-pressed',String(input.type==='text'));
    toggle.setAttribute('aria-label',input.type==='text'?'Hide password':'Show password');
    toggle.querySelector('.icon-eye').hidden=input.type==='text';
    toggle.querySelector('.icon-eye-off').hidden=input.type!=='text';
  }));
  const validPassword=value=>value.length>=8&&/[A-Z]/.test(value)&&/[a-z]/.test(value)&&/[0-9]/.test(value);
  const updateRequirements=()=>{
    const value=newPassword.value;
    const rules={length:value.length>=8,uppercase:/[A-Z]/.test(value),lowercase:/[a-z]/.test(value),number:/[0-9]/.test(value)};
    document.querySelectorAll('.password-requirements li').forEach(item=>item.classList.toggle('met',!!rules[item.dataset.rule]));
    const count=Object.values(rules).filter(Boolean).length;
    const meter=document.getElementById('strengthMeter');
    const label=document.getElementById('strengthLabel');
    meter.classList.remove('level-1','level-2','level-3','level-4');
    if(value){const level=count===4?(value.length>=12?4:3):count>=2?2:1;meter.classList.add('level-'+level);label.textContent=['','Weak','Fair','Good','Strong'][level];}
    else label.textContent='';
  };
  newPassword.addEventListener('input',updateRequirements);
  const disableForm=()=>{form.querySelectorAll('input,button[type="submit"]').forEach(el=>el.disabled=true);notice.hidden=false;};
  if(!client){disableForm();setStatus('Authentication failed to load. Please refresh this page.','error');return;}
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'&&session){recoveryEventSeen=true;recoverySession=true;notice.hidden=true;setStatus('Secure reset session verified. Choose your new password.','success');}
  });
  // Give Supabase's URL callback a moment to exchange the recovery code.
  await new Promise(resolve=>setTimeout(resolve,500));
  const {data:{session}}=await client.auth.getSession();
  const hashIsRecovery=window.location.hash.includes('type=recovery');
  recoverySession=!!session&&(recoveryEventSeen||hashIsRecovery);
  if(!recoverySession){disableForm();setStatus('Open this page using the password reset link sent to your email.','error');return;}
  notice.hidden=true;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    document.getElementById('newPasswordError').textContent='';
    document.getElementById('confirmNewPasswordError').textContent='';
    if(!validPassword(newPassword.value)){document.getElementById('newPasswordError').textContent='Use at least 8 characters with uppercase, lowercase and a number.';setStatus('Please meet all password requirements.','error');return;}
    if(newPassword.value!==confirmPassword.value){document.getElementById('confirmNewPasswordError').textContent='Passwords do not match.';setStatus('Please confirm your new password.','error');return;}
    button.disabled=true;button.querySelector('.btn-text').textContent='Updating…';
    try{
      const {error}=await client.auth.updateUser({password:newPassword.value});
      if(error)throw error;
      setStatus('Password updated successfully. You can now log in with your new password.','success');
      form.reset();
      await client.auth.signOut();
      window.setTimeout(()=>{window.location.href='login.html';},1800);
    }catch(error){setStatus(error.message||'Could not update your password. Request a new reset link.','error');}
    finally{button.disabled=false;button.querySelector('.btn-text').textContent='Update Password';}
  });
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));
});