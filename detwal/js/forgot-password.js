document.addEventListener('DOMContentLoaded', () => {
  const form=document.getElementById('forgotPasswordForm');
  const email=document.getElementById('email');
  const status=document.getElementById('formStatus');
  const button=document.getElementById('resetSubmit');
  const setStatus=(message,type='info')=>{status.textContent=message;status.className='form-status status-'+type;};
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const value=email.value.trim();
    const error=document.getElementById('emailError');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){
      error.textContent='Please enter a valid email address.';
      email.closest('.form-group').classList.add('has-error');
      setStatus('Please enter your registered email address.','error'); return;
    }
    error.textContent=''; email.closest('.form-group').classList.remove('has-error');
    const client=window.detwalSupabase;
    if(!client){setStatus('Authentication failed to load. Refresh and try again.','error');return;}
    button.disabled=true;button.querySelector('.btn-text').textContent='Sending…';
    try{
      const {error}=await client.auth.resetPasswordForEmail(value,{redirectTo:'https://detwal.in/reset-password.html'});
      if(error) throw error;
      setStatus('If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.','success');
    }catch(error){setStatus(error.message||'Could not send the reset email. Please try again.','error');}
    finally{button.disabled=false;button.querySelector('.btn-text').textContent='Send Reset Link';}
  });
  const year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'));
});