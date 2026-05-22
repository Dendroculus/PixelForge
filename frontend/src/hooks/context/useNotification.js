import { useContext } from 'react';
import { NotificationContext } from '../../context/ShowNotification';

/**
 * Consumes the global notification context.
 * * @returns {{
 * notifySuccess: function(string, string=): string,
 * notifyError: function(string, string=): string,
 * notifyLoading: function(string, string=): string,
 * dismissToast: function(string): void
 * }}
 * @throws {Error} If called from a component not wrapped in NotificationProvider
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider tree.');
  }

  return context;
};