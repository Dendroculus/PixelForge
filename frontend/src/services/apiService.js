/**
 * Public frontend API service facade.
 *
 * This module groups feature-specific API functions behind one stable export.
 * Components and hooks can import `apiService` without needing to know the
 * exact service file that owns each backend request.
 */

import { uploadImage } from './features/upscaleService';
import { removeBackgroundImage } from './features/rembgService';
import { colorRestoreImage } from './features/colorRestoreService';
import { removeObjectFromImage } from './features/objectRemoveService';
import { submitFeedback } from './features/feedbackService';
import { pollResult } from './base/pollingService';

/**
 * Aggregated API methods used by frontend hooks and components.
 */
export const apiService = {
  uploadImage,
  removeBackgroundImage,
  colorRestoreImage,
  removeObjectFromImage,
  submitFeedback,
  pollResult,
};
