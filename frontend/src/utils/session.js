import { clearIDB } from './idb';

export const clearAppSession = async (previewUrl = null) => {
  try {
    await clearIDB();
  } catch (e) {
    console.error("Error clearing IDB:", e);
  }
  
  localStorage.removeItem('pf_job_id');
  localStorage.removeItem('pf_progress');
  localStorage.removeItem('pf_result_url');
  localStorage.removeItem('pf_is_processing');
  localStorage.removeItem('pf_refresh_count');
  localStorage.removeItem('pf_result_timestamp'); 
  
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
};