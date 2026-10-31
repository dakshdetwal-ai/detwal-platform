/* DETwal Cloudflare API client. */
(() => {
  const API_BASE_URL = 'https://detwal-api.dakshdetwal10.workers.dev';

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `API error ${response.status}`);
    return data;
  }

  window.detwalApi = {
    baseUrl: API_BASE_URL,
    health: () => request('/health'),
    request
  };

  document.dispatchEvent(new CustomEvent('detwal-api-ready'));
  request('/health')
    .then(data => {
      window.detwalApiStatus = { connected: true, data };
      document.dispatchEvent(new CustomEvent('detwal-api-status', { detail: window.detwalApiStatus }));
      console.info('DETwal API connected:', data);
    })
    .catch(error => {
      window.detwalApiStatus = { connected: false, error: error.message };
      document.dispatchEvent(new CustomEvent('detwal-api-status', { detail: window.detwalApiStatus }));
      console.error('DETwal API connection failed:', error);
    });
})();
