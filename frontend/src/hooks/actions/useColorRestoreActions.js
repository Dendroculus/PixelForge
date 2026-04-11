import { useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { useActions } from './useActions';

export function useColorRestoreActions(props) {
  const apiCallFn = useCallback(
    (file, token) => apiService.colorRestoreImage(file, token),
    []
  );

  return useActions({ ...props, apiCallFn });
}