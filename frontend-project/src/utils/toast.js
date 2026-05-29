import { toast } from 'react-toastify';

// ============================================================
// Close Button SVG
// ============================================================
const CloseIcon = ({ onClick }) => (
  <button
    onClick={onClick}
    className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors focus:outline-none"
    aria-label="Dismiss notification"
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

// ============================================================
// Toast Icons (SVG)
// ============================================================
const Icons = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 4-4" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 002.5 20h19a1 1 0 00.81-1.64l-8.6-14.86a1 1 0 00-1.72 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
    </svg>
  ),
};

// ============================================================
// Toast Content Component
// ============================================================
const ToastContent = ({ icon, message, closeToast }) => (
  <div className="flex items-center gap-3 min-w-[280px]">
    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
      {icon}
    </span>
    <span className="text-sm font-medium leading-snug flex-1">{message}</span>
    <CloseIcon onClick={closeToast} />
  </div>
);

// ============================================================
// Base Styles per type
// ============================================================
const typeStyles = {
  success: {
    className: 'toast-success',
    icon: Icons.success,
    autoClose: 3000,
  },
  error: {
    className: 'toast-error',
    icon: Icons.error,
    autoClose: 5000,
  },
  warning: {
    className: 'toast-warning',
    icon: Icons.warning,
    autoClose: 4000,
  },
  info: {
    className: 'toast-info',
    icon: Icons.info,
    autoClose: 3000,
  },
};

// ============================================================
// Custom Toast Show Functions
// ============================================================
const showToast = (message, type = 'info', options = {}) => {
  const style = typeStyles[type] || typeStyles.info;
  toast(({ closeToast }) => (
    <ToastContent icon={style.icon} message={message} closeToast={closeToast} />
  ), {
    type,
    className: `custom-toast ${style.className}`,
    autoClose: style.autoClose,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    icon: false, // We render our own icon
    ...options,
  });
};

export const showSuccess = (message, options) => showToast(message, 'success', options);
export const showError = (message, options) => showToast(message, 'error', options);
export const showWarning = (message, options) => showToast(message, 'warning', options);
export const showInfo = (message, options) => showToast(message, 'info', options);

export default { showSuccess, showError, showWarning, showInfo };
