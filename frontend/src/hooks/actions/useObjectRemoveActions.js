import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useActions } from './useActions';

export function useObjectRemoveActions(props) {
  const apiCallFn = useCallback(
    (file, token, options = {}) => {
      return apiService.removeObjectFromImage(file, options.maskBlob, token);
    },
    [],
  );

  return useActions({ ...props, apiCallFn });
}