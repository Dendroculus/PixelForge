/**
 * Feature action adapter for color restoration.
 *
 * Binds the shared AI action workflow to the color restoration API call.
 */

import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useActions } from './useActions';

/**
 * Create color restoration action handlers for the shared AI workflow.
 *
 * @returns {object} Hook state and handlers.
 */
export function useColorRestoreActions(props) {
  const apiCallFn = useCallback(
    (file, token) => apiService.colorRestoreImage(file, token),
    [],
  );

  return useActions({ ...props, apiCallFn });
}
