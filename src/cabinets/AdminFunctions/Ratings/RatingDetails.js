import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import { toast } from 'react-toastify';
import './RatingDetails.css';

const RatingDetails = ({ ratingId, onBack }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('homework');

  useEffect(() => {
    fetchDetails();
  }, [ratingId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/get-rating-details`, {
        rating_id: ratingId
      });

      if (response.data.status) {
        setDetails(response.data.details);
      } else {
        setError(response.data.error || 'Ошибка загрузки детализации');
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      setError(err.response?.data?.error || 'Ошибка при загрузке детализации');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'homework', label: '📝 Домашние задания', icon: '📝' },
    { id: 'exams', label: '🎓 Экзамены', icon: '🎓' },
    { id: 'tests', label: '📊 Тесты', icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="rating-details-container">
        <div className="details-loading">
          <div className="spinner-large"></div>
          <p>Загрузка детализации...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rating-details-container">
        <div className="details-error-state">
          <div className="error-icon-large">❌</div>
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button className="back-btn" onClick={onBack}>
            ← Назад к списку
          </button>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <div className="rating-details-container">
      {/* Header */}
      <div className="details-header">
        <button className="details-back-button" onClick={onBack}>
          <span className="back-icon">←</span>
          <span>Назад к списку</span>
        </button>
        <div className="details-header-content">
          <h1>📊 Детализация рейтинга</h1>
          <div className="details-meta">
            <div className="meta-item">
              <span className="meta-label">Период:</span>
              <span className="meta-value">{details.date_from} - {details.date_to}</span>
            </div>
            <div className="meta-item final-rating">
              <span className="meta-label">Общий рейтинг:</span>
              <span className="meta-value-large">{details.final_rating.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="details-navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-section-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="details-content-wrapper">
        {/* Домашние задания */}
        {activeSection === 'homework' && (
          <div className="details-section-content">
            <div className="section-header">
              <h2>📝 Домашние задания</h2>
              <div className="section-rating-badge">
                Средний балл: <strong>{details.homework.rating.toFixed(2)}</strong>
              </div>
            </div>
            <div className="details-grid">
              {details.homework.details && details.homework.details.length > 0 ? (
                details.homework.details.map((hw, idx) => (
                  <div key={idx} className={`detail-card ${hw.status === 'Сдано' ? 'success' : 'failed'}`}>
                    <div className="card-header">
                      <h3 className="card-title">{hw.name}</h3>
                      <div className={`card-score ${hw.status === 'Сдано' ? 'success' : 'failed'}`}>
                        {hw.score.toFixed(2)}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-info">
                        <span className="info-label">Дедлайн:</span>
                        <span className="info-value">{hw.deadline}</span>
                      </div>
                      {hw.date_pass && (
                        <div className="card-info">
                          <span className="info-label">Сдано:</span>
                          <span className="info-value">{hw.date_pass}</span>
                        </div>
                      )}
                      <div className="card-status">
                        <span className={`status-badge ${hw.status === 'Сдано' ? 'success' : 'failed'}`}>
                          {hw.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-card">
                  <div className="no-data-icon">📭</div>
                  <p>Нет данных по домашним заданиям</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Экзамены */}
        {activeSection === 'exams' && (
          <div className="details-section-content">
            <div className="section-header">
              <h2>🎓 Экзамены</h2>
              <div className="section-rating-badge">
                Средний балл: <strong>{details.exams.rating.toFixed(2)}</strong>
              </div>
            </div>
            <div className="details-grid">
              {details.exams.details && details.exams.details.length > 0 ? (
                details.exams.details.map((exam, idx) => (
                  <div key={idx} className={`detail-card ${exam.score > 0 ? 'success' : 'failed'}`}>
                    <div className="card-header">
                      <h3 className="card-title">{exam.exam_name}</h3>
                      <div className={`card-score ${exam.score > 0 ? 'success' : 'failed'}`}>{exam.score.toFixed(2)}</div>
                    </div>
                    <div className="card-body">
                      <div className="card-info">
                        <span className="info-label">Дата:</span>
                        <span className="info-value">{exam.exam_date}</span>
                      </div>
                      <div className="card-status">
                        <span className={`status-badge ${exam.score > 0 ? 'success' : 'failed'}`}>
                          {exam.status || (exam.score > 0 ? 'Сдан' : 'Не сдавал')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-card">
                  <div className="no-data-icon">📭</div>
                  <p>Нет данных по экзаменам</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Тесты */}
        {activeSection === 'tests' && (
          <div className="details-section-content">
            <div className="section-header">
              <h2>📊 Тесты</h2>
              <div className="section-rating-badge">
                Средний балл: <strong>{details.tests.rating.toFixed(2)}</strong>
              </div>
            </div>
            
            {Object.keys(details.tests.directions || {}).length > 0 && (
              <div className="directions-summary-card">
                <h3>📈 Статистика по направлениям</h3>
                <div className="directions-grid">
                  {Object.entries(details.tests.directions).map(([direction, avg]) => (
                    <div key={direction} className="direction-card">
                      <div className="direction-name">{direction}</div>
                      <div className="direction-score">{avg.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="details-grid">
              {details.tests.details && details.tests.details.length > 0 ? (
                details.tests.details.map((test, idx) => (
                  <div key={idx} className={`detail-card ${test.score > 0 ? 'success' : 'failed'}`}>
                    <div className="card-header">
                      <h3 className="card-title">{test.title}</h3>
                      <div className={`card-score ${test.score > 0 ? 'success' : 'failed'}`}>
                        {test.score.toFixed(2)}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-info">
                        <span className="info-label">Направление:</span>
                        <span className="info-value">{test.direction}</span>
                      </div>
                      <div className="card-source">
                        <span className="source-badge">{test.source}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-card">
                  <div className="no-data-icon">📭</div>
                  <p>Нет данных по тестам</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingDetails;

