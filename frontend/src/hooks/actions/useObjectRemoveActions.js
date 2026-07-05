/**
 * Feature action adapter for object removal.
 *
 * Binds the shared AI action workflow to the object removal API call and forwards
 * the generated mask blob required by that backend flow.
 */

import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useActions } from './useActions';

/**
 * Create object removal action handlers for the shared AI workflow.
 *
 * @returns {object} Hook state and handlers.
 */
export function useObjectRemoveActions(props) {
  const apiCallFn = useCallback(
    (file, token, options = {}) => {
      return apiService.removeObjectFromImage(file, options.maskBlob, token);
    },
    [],
  );

  return useActions({ ...props, apiCallFn });
}