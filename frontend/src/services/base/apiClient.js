/**
 * Low-level HTTP client for PixelForge API calls.
 *
 * Centralizes backend URL resolution, JSON response handling, direct Azure upload
 * requests, AI job initialization/start flows, and usage polling helpers.
 */

const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

const DEBUG_API = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

/**
 * Log API debug information only when debug mode is enabled.
 *
 * @returns {void}
 */
export const debugLog = (...args) => {
  if (DEBUG_API) console.log(...args);
};

/**
 * Normalize backend HTTP responses and throw useful application errors.
 *
 * @returns {Promise<object>} Parsed JSON response body.
 */
const handleApiResponse = async (response, defaultErrorMsg) => {
  if (response.status === 429) throw new Error('LIMIT_REACHED');

  if (!response.ok) {
    let detail = defaultErrorMsg;

    try {
      const errData = await response.json();

      if (Array.isArray(errData?.detail)) {
        detail = errData.detail[0].msg;
      } else if (errData?.detail) {
        detail = errData.detail;
      }
    } catch (e) {
      console.warn(`[API Error] Failed to parse error JSON (Status: ${response.status}):`, e);
    }

    throw new Error(detail);
  }

  return response.json();
};

/**
 * Upload a file blob directly to an Azure SAS URL.
 *
 * @returns {Promise<Response>} Azure upload response.
 */
const uploadToAzure = async (uploadUrl, blob, contentType = 'application/octet-stream') => {
  const azureResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!azureResponse.ok) {
    const text = await azureResponse.text().catch(() => '');
    throw new Error(`Cloud upload failed (${azureResponse.status}) ${text}`);
  }

  return azureResponse;
};

export const apiClient = {
  apiUrl,

  async post(endpoint, body) {
    debugLog(`[POST] -> ${apiUrl}${endpoint}`);

    const res = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return handleApiResponse(res, 'Request failed');
  },

  async executeAiJob(feature, file, turnstileToken, additionalPayload = {}) {
    debugLog(`[${feature}] init -> ${apiUrl}/${feature}/init`);

    const initData = await this.post(`/${feature}/init`, {
      cf_turnstile_response: turnstileToken,
      filename: file.name,
    });

    const { job_id, safe_filename, upload_url } = initData;

    debugLog(`[${feature}] upload_url ->`, upload_url);

    await uploadToAzure(
      upload_url,
      file,
      file.type || 'application/octet-stream',
    );

    debugLog(`[${feature}] start -> ${apiUrl}/${feature}/start`);

    await this.post(`/${feature}/start`, {
      job_id,
      safe_filename,
      ...additionalPayload,
    });

    return { job_id };
  },

  async executeObjectRemoveJob(file, maskBlob, turnstileToken) {
    if (!maskBlob) {
      throw new Error('Please paint the object area before starting.');
    }

    debugLog(`[objectremove] init -> ${apiUrl}/objectremove/init`);

    const initData = await this.post('/objectremove/init', {
      cf_turnstile_response: turnstileToken,
      filename: file.name,
    });

    const {
      job_id,
      safe_filename,
      upload_url,
      mask_filename,
      mask_upload_url,
    } = initData;

    debugLog('[objectremove] image upload_url ->', upload_url);
    debugLog('[objectremove] mask upload_url ->', mask_upload_url);

    await uploadToAzure(
      upload_url,
      file,
      file.type || 'application/octet-stream',
    );

    await uploadToAzure(
      mask_upload_url,
      maskBlob,
      'image/png',
    );

    debugLog(`[objectremove] start -> ${apiUrl}/objectremove/start`);

    await this.post('/objectremove/start', {
      job_id,
      safe_filename,
      mask_filename,
    });

    return { job_id };
  },
};