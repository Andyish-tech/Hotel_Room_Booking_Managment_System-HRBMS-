import React from 'react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  if (!isOpen) return null;

  const confirmClasses = variant === 'danger' 
    ? 'btn-danger' 
    : variant === 'success' 
      ? 'btn-success' 
      : 'btn-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all">
        <div className="text-center mb-6">
          <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center
            ${variant === 'danger' ? 'bg-red-100' : variant === 'success' ? 'bg-brand' : 'bg-blue-100'}`}>
            {variant === 'danger' ? (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
          <p className="text-sm text-black">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">{cancelText}</button>
          <button onClick={onConfirm} className={`${confirmClasses} flex-1`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
