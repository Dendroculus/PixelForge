const apiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

const DEBUG_API = import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

/**
 * Logs debugging information if enabled in the environment.
 * @param {...any} args - Data to log.
 */
export const debugLog = (...args) => {
  if (DEBUG_API) console.log(...args);
};

/**
 * Standardizes fetch error handling across all API requests.
 * @param {Response} response - The fetch response object.
 * @param {string} defaultErrorMsg - Fallback error message.
 * @returns {Promise<Object>} The parsed JSON response.
 */
const handleApiResponse = async (response, defaultErrorMsg) => {
  if (response.status === 429) throw new Error('LIMIT_REACHED');
  if (!response.ok) {
    let detail = defaultErrorMsg;
    try {
      const errData = await response.json();
      detail = errData?.detail || detail;
    } catch (e) {
      console.warn(`[API Error] Failed to parse error JSON (Status: ${response.status}):`, e);
    }
    throw new Error(detail);
  }
  return response.json();
};

export const apiClient = {
  apiUrl,

  /**
   * Executes a standard POST request.
   * @param {string} endpoint - The API endpoint (e.g., '/feedback').
   * @param {Object} body - The JSON payload.
   * @returns {Promise<Object>}
   */
  async post(endpoint, body) {
    debugLog(`[POST] -> ${apiUrl}${endpoint}`);
    const res = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleApiResponse(res, 'Request failed');
  },

  /**
   * Orchestrates the unified 3-step AI processing pipeline (Init -> Azure Upload -> Start).
   * @param {string} feature - The feature endpoint prefix (e.g., 'upscale', 'rembg').
   * @param {File} file - The user's uploaded image file.
   * @param {string} turnstileToken - Cloudflare Turnstile verification token.
   * @param {Object} [additionalPayload={}] - Extra parameters for the start route (e.g., scale).
   * @returns {Promise<{job_id: string}>}
   */
  async executeAiJob(feature, file, turnstileToken, additionalPayload = {}) {
    debugLog(`[${feature}] init -> ${apiUrl}/${feature}/init`);
    
    const initData = await this.post(`/${feature}/init`, {
      cf_turnstile_response: turnstileToken,
      filename: file.name,
    });

    const { job_id, safe_filename, upload_url } = initData;
    debugLog(`[${feature}] upload_url ->`, upload_url);

    const azureResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    debugLog(`[${feature}] azure PUT status ->`, azureResponse.status);

    if (!azureResponse.ok) {
      const text = await azureResponse.text().catch(() => '');
      throw new Error(`Cloud upload failed (${azureResponse.status}) ${text}`);
    }

    debugLog(`[${feature}] start -> ${apiUrl}/${feature}/start`);
    
    await this.post(`/${feature}/start`, {
      job_id,
      safe_filename,
      ...additionalPayload,
    });

    return { job_id };
  }
};