/**
 * Feature action adapter for background removal.
 *
 * Binds the shared AI action workflow to the background removal API call.
 */

import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useActions } from '../actions/useActions';

/**
 * Create background removal action handlers for the shared AI workflow.
 *
 * @returns {object} Hook state and handlers.
 */
export function useRemBGActions(props) {
  const apiCallFn = useCallback(
    (file, token) => apiService.removeBackgroundImage(file, token),
    [],
  );

  return useActions({ ...props, apiCallFn });
}
