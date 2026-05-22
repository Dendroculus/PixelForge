import { createContext, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import PropTypes from 'prop-types';

const NotificationContext = createContext(null);

const defaultOptions = {
  duration: 4000,
  style: {
    background: '#1F2937',
    color: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #374151',
  },
};

/**
 * Global provider for application notifications.
 * Encapsulates the toaster UI and abstraction methods.
 * * @param {Object} props
 * @param {React.ReactNode} props.children
 * @returns {JSX.Element}
 */
export const NotificationProvider = ({ children }) => {
  const contextValue = useMemo(() => ({
    /**
     * @param {string} message
     * @param {string} [id] - Optional ID to update an existing toast
     * @returns {string} The active toast ID
     */
    notifySuccess: (message, id = null) => 
      toast.success(message, { ...defaultOptions, id }),

    /**
     * @param {string} message
     * @param {string} [id]
     * @returns {string} The active toast ID
     */
    notifyError: (message, id = null) => 
      toast.error(message, { ...defaultOptions, duration: 6000, id }),

    /**
     * @param {string} message
     * @param {string} [id]
     * @returns {string} The active toast ID
     */
    notifyLoading: (message, id = null) => 
      toast.loading(message, { ...defaultOptions, id }),

    /**
     * @param {string} toastId
     */
    dismissToast: (toastId) => toast.dismiss(toastId),
  }), []);

  return (
    <NotificationContext.Provider value={contextValue}>
      <Toaster position="bottom-right" reverseOrder={false} />
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
