import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  const btnStyles = {
    danger: 'bg-crm-danger hover:bg-red-600 focus:ring-crm-danger/50 text-white',
    primary: 'bg-crm-primary hover:bg-crm-primaryHover focus:ring-crm-primary/50 text-white',
    success: 'bg-crm-success hover:bg-emerald-600 focus:ring-crm-success/50 text-white',
    info: 'bg-crm-info hover:bg-blue-600 focus:ring-crm-info/50 text-white',
  };

  const currentBtnStyle = btnStyles[type] || btnStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-crm-dark/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Box */}
      <div 
        className="glass-panel w-full max-w-md transform overflow-hidden rounded-xl p-6 shadow-2xl transition-all duration-300 border border-crm-border/60 hover:border-crm-primary/30 relative"
        style={{
          background: 'rgba(21, 28, 44, 0.95)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-crm-textMuted hover:text-crm-text focus:outline-none transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start space-x-4 mt-2">
          {/* Warning Icon */}
          <div className={`p-2 rounded-full flex-shrink-0 bg-crm-danger/10 text-crm-danger`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-crm-text leading-6">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-crm-textMuted">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-crm-border bg-transparent text-crm-text hover:bg-crm-cardHover focus:outline-none transition-colors active:scale-98"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-crm-dark transition-all active:scale-98 ${currentBtnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
