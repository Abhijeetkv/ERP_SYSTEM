import React, { useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

const variantStyles = {
  danger: {
    icon: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  const [confirming, setConfirming] = useState(false);
  const styles = variantStyles[variant] || variantStyles.danger;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (!confirming) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={confirming}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${styles.button}`}
          >
            {confirming && <LoadingSpinner size={16} className="text-white" />}
            {confirming ? 'Processing…' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        {/* Warning icon */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.icon}`}>
          <FiAlertTriangle className="h-6 w-6" />
        </div>

        {/* Message */}
        <p className="text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
