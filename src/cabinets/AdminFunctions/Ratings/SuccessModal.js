import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div className="success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <svg viewBox="0 0 100 100" className="checkmark-svg">
              <circle cx="50" cy="50" r="45" className="checkmark-circle" />
              <path d="M 30 50 L 45 65 L 70 35" className="checkmark-check" />
            </svg>
          </div>
        </div>
        <h2 className="success-title">Расчет успешно завершен!</h2>
        <p className="success-message">{message}</p>
        <button className="success-close-btn" onClick={onClose}>
          Отлично!
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;

