import { apiClient } from './apiClient';

/**
 * Polls the backend for the status of an ongoing job.
 * @param {string} jobId - The unique identifier of the job.
 * @returns {Promise<Object>} The status and optional data of the job.
 */
export async function pollResult(jobId) {
  try {
    const res = await fetch(`${apiClient.apiUrl}/result/${jobId}`);
    if (!res.ok) return { success: false, error: true, status: res.status };

    const data = await res.json();
    
    if (data.status === 'ready') return { success: true, data };
    if (data.status === 'failed') return { success: false, failed: true, message: data.message };
    
    return { success: false, processing: true };
  } catch {
    return { success: false, error: true };
  }
}