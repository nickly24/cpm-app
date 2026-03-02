import React, { useState, useEffect } from 'react';
import axios from '../../api';
import QRCode from 'qrcode';
import './Progress.css';
import { API_EXAM_URL } from '../../Config';
import { useAuth } from '../../AuthContext';

const Progress = ({ onBack }) => {
  const { user } = useAuth();
  const studentName = user?.full_name;
  const studentId = user?.id;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQr, setShowQr] = useState(false);

  const generateQRCode = async (text) => {
    const str = text != null && String(text).trim() !== '' ? String(text).trim() : null;
    if (!str) return;
    try {
      const url = await QRCode.toDataURL(str, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Ошибка генерации QR-кода:', err);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API_EXAM_URL}/my-rating`);
        if (response.data.status && response.data.data) {
          setDashboard(response.data.data);
        } else {
          setDashboard(null);
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Error fetching rating:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    if (studentId != null && String(studentId).trim() !== '') {
      generateQRCode(String(studentId));
    }
  }, [studentId]);

  const formatValue = (v) => {
    if (v == null || Number.isNaN(v)) return '—';
    const n = Number(v);
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  };

  // Полоска прогресса: шкала 0–5 → процент для заливки
  const BarProgress = ({ value, label, color }) => {
    const num = value != null && !Number.isNaN(Number(value)) ? Number(value) : 0;
    const percent = Math.min(100, Math.max(0, (num / 5) * 100));
    return (
      <div className="progress-bar-card">
        <div className="progress-bar-track" role="progressbar" aria-valuenow={num} aria-valuemin={0} aria-valuemax={5} aria-label={label}>
          <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
        </div>
        <div className="progress-bar-meta">
          <span className="progress-bar-value" style={{ color }}>{formatValue(value)}</span>
          <span className="progress-bar-label">{label}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="content-section progress-loading">
        <div className="progress-loading-spinner" />
        <p>Загрузка успеваемости...</p>
      </div>
    );
  }

  return (
    <div className="content-section progress-page">
      <div className="welcome-section">
        <h2>Добро пожаловать, {studentName}! 👋</h2>
      </div>

      {error && (
        <div className="progress-error">{error}</div>
      )}

      {!error && (
        <div className="progress-dashboard">
          <p className="progress-dashboard-desc">Ваши баллы по направлениям</p>
          <div className="progress-bars">
            <BarProgress
              value={dashboard?.homework?.rating}
              label="Домашки"
              color="#27ae60"
            />
            <BarProgress
              value={dashboard?.exams?.rating}
              label="Экзамены"
              color="#8e44ad"
            />
            <BarProgress
              value={dashboard?.tests?.rating}
              label="Тесты"
              color="#d35400"
            />
          </div>
          {!dashboard && !error && (
            <p className="progress-no-data">Рейтинг ещё не рассчитан. Данные появятся после расчёта администратором.</p>
          )}
        </div>
      )}

      <div className="progress-qr-section">
        <button
          type="button"
          className="progress-qr-toggle"
          onClick={() => setShowQr(!showQr)}
        >
          {showQr ? 'Скрыть QR-код' : 'Ваш QR-код для посещаемости'}
        </button>
        {showQr && (
          <div className="progress-qr-block">
            <p className="progress-qr-desc">Покажите этот код для отметки посещаемости</p>
            {qrCodeUrl ? (
              <div className="progress-qr-img-wrap">
                <img src={qrCodeUrl} alt="QR код студента" className="progress-qr-img" />
              </div>
            ) : (
              <p className="progress-qr-loading">Загрузка QR-кода...</p>
            )}
            <p className="progress-qr-id">Ваш ID: <strong>{studentId}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Progress;
