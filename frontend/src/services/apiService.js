const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

function sanitizeScale(scale) {
  const n = Number(scale);
  if (!Number.isFinite(n)) return 2;
  const i = Math.trunc(n);
  if (i < 1) return 1;
  if (i > 4) return 4;
  return i;
}

export const apiService = {
  async uploadImage(file, turnstileToken, scale = 2) {
    const safeScale = sanitizeScale(scale);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', 'general');
    formData.append('scale', String(safeScale));
    formData.append('cf_turnstile_response', turnstileToken);

    const response = await fetch(`${apiUrl}/upscale`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 429) {
      throw new Error('LIMIT_REACHED');
    }

    if (!response.ok) {
      let detail = 'Upload failed';
      try {
        const errData = await response.json();
        if (errData?.detail) detail = errData.detail;
      } catch {
        // keep generic
      }
      throw new Error(detail);
    }

    try {
      return await response.json();
    } catch {
      throw new Error('Invalid server response');
    }
  },

  async pollResult(jobId) {
    try {
      console.log('poll data', data);
      const res = await fetch(`${apiUrl}/result/${jobId}`, { cache: 'no-store' });

      if (res.status === 429) {
        return { success: false, error: false, rateLimited: true, transient: true };
      }

      if (!res.ok) {
        // 5xx are transient infra issues
        if (res.status >= 500) {
          return { success: false, error: false, transient: true, status: res.status };
        }
        // 4xx from result endpoint are terminal for this polling session
        return { success: false, error: true, transient: false, status: res.status };
      }

      const data = await res.json();

      if (data.status === 'ready') return { success: true, data };
      if (data.status === 'processing') return { success: false, error: false, transient: false };
      if (data.status === 'failed') return { success: false, error: true, transient: false, failed: true };

      return { success: false, error: true, transient: false };
    } catch (err) {
      console.error('Polling network/transient failure:', err);
      return { success: false, error: false, transient: true };
    }
  },
};