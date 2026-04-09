import { useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { useActions } from '../actions/useActions';

export function useUpscaleActions(props) {
  const { scale } = props;
  const apiCallFn = useCallback(
    (file, token) => apiService.uploadImage(file, token, scale),
    [scale]
  );

  return useActions({ ...props, apiCallFn });
}