const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

const DEBUG_API = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';
const debugLog = (...args) => {
  if (DEBUG_API) console.log(...args);
};

export const apiService = {
  async uploadImage(file, turnstileToken, scale = 2) {
    debugLog('[uploadImage] init ->', `${apiUrl}/upscale/init`);

    const initResponse = await fetch(`${apiUrl}/upscale/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cf_turnstile_response: turnstileToken,
        filename: file.name,
      }),
    });

    debugLog('[uploadImage] init status ->', initResponse.status);

    if (initResponse.status === 429) throw new Error('LIMIT_REACHED');
    if (!initResponse.ok) {
      let detail = 'Initialization failed';
      try {
        const errData = await initResponse.json();
        detail = errData?.detail || detail;
      } catch (parseError) {
          console.warn(`[API Error] Failed to parse error JSON (Status: ${initResponse.status}):`, parseError);
      }
      throw new Error(detail);
    }

    const { job_id, safe_filename, upload_url } = await initResponse.json();
    debugLog('[uploadImage] upload_url ->', upload_url);

    const azureResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    debugLog('[uploadImage] azure PUT status ->', azureResponse.status);

    if (!azureResponse.ok) {
      const text = await azureResponse.text().catch(() => '');
      throw new Error(`Cloud upload failed (${azureResponse.status}) ${text}`);
    }

    debugLog('[uploadImage] start ->', `${apiUrl}/upscale/start`);

    const startResponse = await fetch(`${apiUrl}/upscale/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id,
        safe_filename,
        scale,
      }),
    });

    debugLog('[uploadImage] start status ->', startResponse.status);

    if (!startResponse.ok) {
      let detail = 'Failed to start processing';
      try {
        const errData = await startResponse.json();
        detail = errData?.detail || detail;
      } catch (parseError) {
        console.warn(`[API Error] Failed to parse error JSON (Status: ${startResponse.status}):`, parseError);
      }
      throw new Error(detail);
    }

    return { job_id };
  },

  async removeBackgroundImage(file, turnstileToken) {
    debugLog('[removeBackgroundImage] init ->', `${apiUrl}/rembg/init`);

    const initResponse = await fetch(`${apiUrl}/rembg/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cf_turnstile_response: turnstileToken,
        filename: file.name,
      }),
    });

    debugLog('[removeBackgroundImage] init status ->', initResponse.status);

    if (initResponse.status === 429) throw new Error('LIMIT_REACHED');
    if (!initResponse.ok) {
      let detail = 'Initialization failed';
      try {
        const errData = await initResponse.json();
        detail = errData?.detail || detail;
      } catch (parseError) {
        console.warn(`[API Error] Failed to parse error JSON (Status: ${initResponse.status}):`, parseError);
      }
      throw new Error(detail);
    }

    const { job_id, safe_filename, upload_url } = await initResponse.json();
    debugLog('[removeBackgroundImage] upload_url ->', upload_url);

    const azureResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    debugLog('[removeBackgroundImage] azure PUT status ->', azureResponse.status);

    if (!azureResponse.ok) {
      const text = await azureResponse.text().catch(() => '');
      throw new Error(`Cloud upload failed (${azureResponse.status}) ${text}`);
    }

    debugLog('[removeBackgroundImage] start ->', `${apiUrl}/rembg/start`);

    const startResponse = await fetch(`${apiUrl}/rembg/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id, safe_filename }),
    });

    debugLog('[removeBackgroundImage] start status ->', startResponse.status);

    if (!startResponse.ok) {
      let detail = 'Failed to start processing';
      try {
        const errData = await startResponse.json();
        detail = errData?.detail || detail;
      } catch (parseError) {
        console.warn(`[API Error] Failed to parse error JSON (Status: ${startResponse.status}):`, parseError);
      }
      throw new Error(detail);
    }

    return { job_id };
  },

  async colorRestoreImage(file, turnstileToken) {
    debugLog('[colorRestoreImage] init ->', `${apiUrl}/colorrestore/init`);

    const initResponse = await fetch(`${apiUrl}/colorrestore/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cf_turnstile_response: turnstileToken,
        filename: file.name,
      }),
    });

    debugLog('[colorRestoreImage] init status ->', initResponse.status);

    if (initResponse.status === 429) throw new Error('LIMIT_REACHED');
    if (!initResponse.ok) {
      let detail = 'Initialization failed';
      try {
        const errData = await initResponse.json();
        detail = errData?.detail || detail;
      } catch (parseError) {
        console.warn(`[API Error] Failed to parse error JSON (Status: ${initResponse.status}):`, parseError);
      }
      throw new Error(detail);
    }

    const { job_id, safe_filename, upload_url } = await initResponse.json();
    debugLog('[colorRestoreImage] upload_url ->', upload_url);

    const azureResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    debugLog('[colorRestoreImage] azure PUT status ->', azureResponse.status);

    if (!azureResponse.ok) {
      const text = await azureResponse.text().catch(() => '');
      throw new Error(`Cloud upload failed (${azureResponse.status}) ${text}`);
    }

    debugLog('[colorRestoreImage] start ->', `${apiUrl}/colorrestore/start`);

    const startResponse = await fetch(`${apiUrl}/colorrestore/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id, safe_filename }),
    });

    debugLog('[colorRestoreImage] start status ->', startResponse.status);

    if (!startResponse.ok) {
      let detail = 'Failed to start processing';
      try {
        const errData = await startResponse.json();
        detail = errData?.detail || detail;
      } catch (parseError) {
        console.warn(`[API Error] Failed to parse error JSON (Status: ${startResponse.status}):`, parseError);
      }
      throw new Error(detail);
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

      if (data.status === 'ready') return { success: true, data };
      if (data.status === 'processing') return { success: false, error: false };
      if (data.status === 'failed') return { success: false, error: true };

      return { success: false, error: true };
    } catch (err) {
      console.error('Polling failed:', err);
      return { success: false, error: true };
    }
  },
};