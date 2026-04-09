const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

export const apiService = {
  async uploadImage(file, turnstileToken, scale = 2) {
    const initResponse = await fetch(`${apiUrl}/upscale/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cf_turnstile_response: turnstileToken,
        filename: file.name,
      }),
    });

    if (initResponse.status === 429) throw new Error('LIMIT_REACHED');
    if (!initResponse.ok) {
      const errData = await initResponse.json();
      throw new Error(errData.detail || 'Initialization failed');
    }

    const { job_id, safe_filename, upload_url } = await initResponse.json();

    const azureResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!azureResponse.ok) throw new Error('Cloud upload failed');

    const startResponse = await fetch(`${apiUrl}/upscale/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id,
        safe_filename,
        scale,
      }),
    });

    if (!startResponse.ok) {
      const errData = await startResponse.json();
      throw new Error(errData.detail || 'Failed to start processing');
    }

    return { job_id };
  },

  async removeBackgroundImage(file, turnstileToken) {
    const initResponse = await fetch(`${apiUrl}/rembg/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cf_turnstile_response: turnstileToken,
        filename: file.name,
      }),
    });

    if (initResponse.status === 429) throw new Error('LIMIT_REACHED');
    if (!initResponse.ok) {
      const errData = await initResponse.json();
      throw new Error(errData.detail || 'Initialization failed');
    }

    const { job_id, safe_filename, upload_url } = await initResponse.json();

    const azureResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!azureResponse.ok) throw new Error('Cloud upload failed');

    const startResponse = await fetch(`${apiUrl}/rembg/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id, safe_filename }),
    });

    if (!startResponse.ok) {
      const errData = await startResponse.json();
      throw new Error(errData.detail || 'Failed to start processing');
    }

    return { job_id };
  },

  async pollResult(jobId) {
    try {
      const res = await fetch(`${apiUrl}/result/${jobId}`);

      if (res.status === 429) {
        return { success: false, error: false, rateLimited: true };
      }

      if (!res.ok) {
        return { success: false, error: true, status: res.status };
      }

      const data = await res.json();

      if (data.status === 'ready') {
        return { success: true, data };
      }

      if (data.status === 'processing') {
        return { success: false, error: false };
      }

      if (data.status === 'failed') {
        return { success: false, error: true };
      }

      return { success: false, error: true };
    } catch (err) {
      console.error('Polling failed:', err);
      return { success: false, error: true };
    }
  },
};