import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useActions } from '../actions/useActions';

export function useRemBGActions(props) {
  const apiCallFn = useCallback(
    (file, token) => apiService.removeBackgroundImage(file, token),
    [],
  );

  return useActions({ ...props, apiCallFn });
}
