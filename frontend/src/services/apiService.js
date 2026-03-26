const ApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiService = {
  async uploadImage(file, modelType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_type', modelType);

    const response = await fetch(`${ApiBaseUrl}/upscale`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.detail || 'Upload failed due to server error');
    }
    
    return response.json();
  },

  async pollResult(jobId) {
    try {
      const res = await fetch(`${ApiBaseUrl}/result/${jobId}`); 
      
      if (!res.ok) {
        return { success: false, error: true };
      }

      const data = await res.json();

      if (data.status === "ready") {
          return { success: true, data: data };
      } else if (data.status === "processing") {
          return { success: false, error: false }; 
      } else if (data.status === "failed") {
          console.error("Backend reported job failure");
          return { success: false, error: true }; 
      }

      return { success: false, error: true };

    } catch (err) {
      console.error("Polling fetch failed:", err);
      return { success: false, error: true };
    }
  }
};