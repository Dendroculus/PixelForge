import { usePipeline } from './usePipeline';
import { useObjectRemoveActions } from '../actions/useObjectRemoveActions';

export function useObjectRemovePipeline(setProgress) {
  return usePipeline(setProgress, useObjectRemoveActions, 'objectremove');
}