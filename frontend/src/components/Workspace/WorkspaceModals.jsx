import PropTypes from 'prop-types';
import LegalModal from '../Common/LegalModal';
import CountdownTimer from '../Common/CountdownTimer';
import { APP_CONFIG as config, STORAGE_KEYS } from '../../config';

export default function WorkspaceModals({ appAlert, setAppAlert, featureName }) {
  const closeAndClear = () => {
    setAppAlert({ show: false, type: null });
    localStorage.removeItem(STORAGE_KEYS.ALERT);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
  };

  const imageTypeName = featureName === 'upscale' ? 'upscaled' : 'transparent';

  return (
    <>
      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'potato'}
        onClose={closeAndClear}
        title="Whoa, slow down! 👀"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-slate-800 text-base">We're working on it!</p>
          <p>Please wait as your image is being processed on our potato server (●'◡'●)</p>
          <p>Since this is a free, open-source project, we are trying to save costs. Refreshing the page won't speed up the AI, but it might make our server cry.</p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'dos'}
        onClose={closeAndClear}
        title="Processing Failed ❌"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-rose-600 text-base mb-2">Image failed to process.</p>
          <p>Sorry our servers are currently busy and cannot process your request at the moment.</p>
          <p>Please try again, we're really trying our best! 🥲</p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'reserved_warning'}
        onClose={() => setAppAlert({ show: false, type: null })}
        title="Session Restored 🔄"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-slate-800 text-base mb-2">We reserved your image!</p>
          <p>Just letting you know that your {imageTypeName} image won't stay here forever.</p>
          <p>
            Please remember to download it before it expires in{' '}
            <CountdownTimer
              targetTimestamp={Number(localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP)) + config.RESULT_EXPIRATION_TIME}
              isWarning={true}
              onExpire={() => setAppAlert({ show: true, type: 'expired' })}
            />
            {' '}minutes!
          </p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'expired'}
        onClose={() => {
          setAppAlert({ show: false, type: null });
          localStorage.removeItem(STORAGE_KEYS.ALERT);
        }}
        title="Session Expired ⏱️"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-rose-600 text-base mb-2">Image deleted for privacy.</p>
          <p>Your session timed out and your image was permanently deleted from your browser and our servers to protect your privacy.</p>
          <p>Please upload your image again if you still need to process it!</p>
        </div>
      </LegalModal>
    </>
  );
}

WorkspaceModals.propTypes = {
  appAlert: PropTypes.object.isRequired,
  setAppAlert: PropTypes.func.isRequired,
  featureName: PropTypes.string.isRequired,
};