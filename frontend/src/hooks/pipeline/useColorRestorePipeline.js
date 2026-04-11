import { usePipeline } from './usePipeline';
import { useColorRestoreActions } from '../actions/useColorRestoreActions';

export function useColorRestorePipeline(setProgress) {
  return usePipeline(setProgress, useColorRestoreActions, 'colorrestore');
}