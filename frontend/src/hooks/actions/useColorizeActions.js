import { useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { useActions } from '../actions/useActions';

export function useColorizeActions(props) {
  const apiCallFn = useCallback(
    (file, token) => apiService.colorizeImage(file, token),
    []
  );

  return useActions({ ...props, apiCallFn });
}