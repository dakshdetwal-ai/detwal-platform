/* DETwal backend status: Supabase Auth + PostgreSQL + Edge Functions. */
(() => {
  const client=window.detwalSupabase;
  window.detwalApi={
    baseUrl:'https://evsnwenvmwhrohyzrjgq.supabase.co',
    health:async()=>{
      if(!client)throw new Error('Supabase client is unavailable');
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      return {success:true,authenticated:!!data.session,backend:'Supabase'};
    },
    request:async(path,options={})=>{
      if(!client)throw new Error('Supabase client is unavailable');
      const {data,error}=await client.auth.getSession();
      if(error||!data.session)throw new Error('Please sign in first');
      const response=await fetch('https://evsnwenvmwhrohyzrjgq.supabase.co/functions/v1/admin-api'+path,{
        ...options,headers:{'Content-Type':'application/json','apikey':'sb_publishable_Vfy2VLbqRYB_DOsK13iuqA_9-pk4Q5t','Authorization':'Bearer '+data.session.access_token,...(options.headers||{})}
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.message||'Supabase request failed');
      return result;
    }
  };
  document.dispatchEvent(new CustomEvent('detwal-api-ready'));
  window.detwalApiStatus={connected:true,backend:'Supabase'};
  document.dispatchEvent(new CustomEvent('detwal-api-status',{detail:window.detwalApiStatus}));
})();