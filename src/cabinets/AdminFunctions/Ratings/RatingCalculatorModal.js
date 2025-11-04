import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import { toast } from 'react-toastify';
import './RatingCalculatorModal.css';

const RatingCalculatorModal = ({ isOpen, onClose, onSuccess }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  // Устанавливаем текущий год по умолчанию
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setDateFrom(`${currentYear}-01-01`);
    setDateTo(`${currentYear}-12-31`);
  }, []);

  const handleCalculate = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Пожалуйста, укажите обе даты');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Начальная дата должна быть меньше конечной');
      return;
    }

    setIsCalculating(true);
    setProgress(0);
    setStatus('Начинаем расчет...');

    try {
      // Симуляция прогресса для UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 5;
        });
      }, 500);

      const response = await axios.post(`${API_BASE_URL}/calculate-all-ratings`, {
        date_from: dateFrom,
        date_to: dateTo
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('Готово!');

      if (response.data.status) {
        // Закрываем модалку и показываем окно успеха
        setTimeout(() => {
          setIsCalculating(false);
          onSuccess(response.data.message || 'Рейтинги успешно рассчитаны!');
        }, 1000);
      } else {
        toast.error(response.data.error || 'Ошибка при расчете рейтингов');
        setIsCalculating(false);
        setProgress(0);
        setStatus('');
      }
    } catch (error) {
      console.error('Error calculating ratings:', error);
      toast.error(error.response?.data?.error || 'Ошибка при расчете рейтингов');
      setIsCalculating(false);
      setProgress(0);
      setStatus('');
    }
  };

  const handleClose = () => {
    if (!isCalculating) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="calculator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🧮 Калькулятор рейтинга</h2>
          {!isCalculating && (
            <button className="modal-close-btn" onClick={handleClose}>
              ✕
            </button>
          )}
        </div>

        <div className="modal-content">
          {!isCalculating ? (
            <>
              <div className="calculator-form">
                <div className="form-group">
                  <label htmlFor="dateFrom">Начальная дата:</label>
                  <input
                    type="date"
                    id="dateFrom"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateTo">Конечная дата:</label>
                  <input
                    type="date"
                    id="dateTo"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="calculator-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-text">
                  <strong>Внимание!</strong>
                  <p>Расчет рейтингов может занять продолжительное время.</p>
                  <p>Не закрывайте браузер и не выключайте компьютер до завершения операции.</p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={handleClose}
                >
                  Отмена
                </button>
                <button
                  className="btn-calculate"
                  onClick={handleCalculate}
                >
                  Рассчитать рейтинги
                </button>
              </div>
            </>
          ) : (
            <div className="calculation-progress">
              <div className="progress-animation">
                <div className="progress-ring">
                  <svg className="progress-svg" viewBox="0 0 100 100">
                    <circle
                      className="progress-circle-bg"
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e9ecef"
                      strokeWidth="8"
                    />
                    <circle
                      className="progress-circle"
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                      transform="rotate(-90 50 50)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="progress-text">
                    <span className="progress-percent">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>

              <div className="progress-status">
                <div className="status-text">{status}</div>
                <div className="status-dots">
                  <span className="dot dot-1"></span>
                  <span className="dot dot-2"></span>
                  <span className="dot dot-3"></span>
                </div>
              </div>

              <div className="progress-warning">
                <div className="warning-icon-small">⚠️</div>
                <p>Не закрывайте браузер и не выключайте компьютер!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingCalculatorModal;

