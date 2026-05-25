import React, { useEffect, useState } from 'react';

const ToastItem = ({ toast, removeToast }) => {
  const { id, message, type, duration } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return;
    const intervalTime = 20; // Update every 20ms
    const step = (intervalTime / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration]);

  // Color mapping based on type
  const styles = {
    success: {
      border: 'border-crm-success/40 shadow-crm-success/10',
      iconColor: 'text-crm-success',
      barBg: 'bg-crm-success',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      border: 'border-crm-danger/40 shadow-crm-danger/10',
      iconColor: 'text-crm-danger',
      barBg: 'bg-crm-danger',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      border: 'border-crm-warning/40 shadow-crm-warning/10',
      iconColor: 'text-crm-warning',
      barBg: 'bg-crm-warning',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      border: 'border-crm-info/40 shadow-crm-info/10',
      iconColor: 'text-crm-info',
      barBg: 'bg-crm-info',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div
      className={`glass-card max-w-sm w-80 pointer-events-auto rounded-lg overflow-hidden shadow-lg border relative translate-y-0 transition-all duration-300 ${currentStyle.border} hover:scale-102`}
      style={{
        background: 'rgba(21, 28, 44, 0.85)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
      }}
    >
      <div className="p-4 flex items-start space-x-3">
        <div className={`flex-shrink-0 ${currentStyle.iconColor}`}>
          {currentStyle.icon}
        </div>
        <div className="flex-1 text-sm font-medium text-crm-text">
          {message}
        </div>
        <button
          onClick={() => removeToast(id)}
          className="flex-shrink-0 text-crm-textMuted hover:text-crm-text focus:outline-none transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-crm-border/30">
          <div
            className={`h-full transition-all duration-200 ease-linear ${currentStyle.barBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
