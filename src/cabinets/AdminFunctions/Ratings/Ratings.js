import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import { toast } from 'react-toastify';
import './Ratings.css';
import RatingCalculatorModal from './RatingCalculatorModal';
import RatingDetails from './RatingDetails';
import SuccessModal from './SuccessModal';

const Ratings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRatingId, setSelectedRatingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/get-all-ratings`);
      
      if (response.data.status) {
        setRatings(response.data.ratings || []);
      } else {
        toast.error('Ошибка загрузки рейтингов');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Ошибка при загрузке рейтингов');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRatings = () => {
    setIsCalculatorOpen(true);
  };

  const handleCalculateSuccess = async (message) => {
    setIsCalculatorOpen(false);
    setSuccessMessage(message || 'Расчет успешно завершен!');
    setShowSuccess(true);
    // Обновляем список после расчета
    await fetchRatings();
  };

  const handleViewDetails = (ratingId) => {
    setSelectedRatingId(ratingId);
    setShowDetails(true);
  };

  const handleBackToList = () => {
    setShowDetails(false);
    setSelectedRatingId(null);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  if (loading) {
    return (
      <div className="ratings-container">
        <div className="ratings-loading">
          <div className="spinner"></div>
          <p>Загрузка рейтингов...</p>
        </div>
      </div>
    );
  }

  // Если показываем детализацию
  if (showDetails && selectedRatingId) {
    return (
      <RatingDetails
        ratingId={selectedRatingId}
        onBack={handleBackToList}
      />
    );
  }

  // Основной вид - таблица рейтингов
  return (
    <div className="ratings-container">
      <div className="ratings-header">
        <div className="ratings-title-section">
          <h1>Рейтинги студентов</h1>
          <p className="ratings-subtitle">Текущие рейтинги всех студентов</p>
        </div>
        <button 
          className="calculate-ratings-btn"
          onClick={handleCalculateRatings}
        >
          <span className="btn-icon">🧮</span>
          <span>Калькулятор рейтинга</span>
        </button>
      </div>

      {ratings.length === 0 ? (
        <div className="ratings-empty">
          <div className="empty-icon">📊</div>
          <h2>Рейтинги еще не рассчитаны</h2>
          <p>Нажмите кнопку "Калькулятор рейтинга" чтобы рассчитать рейтинги для всех студентов</p>
          <button 
            className="calculate-ratings-btn empty-btn"
            onClick={handleCalculateRatings}
          >
            <span className="btn-icon">🧮</span>
            <span>Рассчитать рейтинги</span>
          </button>
        </div>
      ) : (
        <div className="ratings-table-wrapper">
          <div className="ratings-table-container">
            <table className="ratings-table">
              <thead>
                <tr>
                  <th>Место</th>
                  <th>Студент</th>
                  <th>Класс</th>
                  <th>Группа</th>
                  <th>ДЗ</th>
                  <th>Экзамены</th>
                  <th>Тесты</th>
                  <th>Общий рейтинг</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating, index) => (
                  <tr key={rating.id}>
                    <td className="place-cell">
                      <span className={`place-badge place-${index + 1 <= 3 ? index + 1 : 'other'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="student-cell">
                      <strong>{rating.student_name || `ID: ${rating.student_id}`}</strong>
                    </td>
                    <td>{rating.student_class || '-'}</td>
                    <td>{rating.group_name || '-'}</td>
                    <td className="score-cell">{rating.homework.toFixed(2)}</td>
                    <td className="score-cell">{rating.exams.toFixed(2)}</td>
                    <td className="score-cell">{rating.tests.toFixed(2)}</td>
                    <td className="final-score-cell">
                      <span className="final-score">{rating.final.toFixed(2)}</span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="view-details-btn"
                        onClick={() => handleViewDetails(rating.id)}
                        title="Просмотреть детализацию"
                      >
                        👁️ Детали
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно калькулятора */}
      <RatingCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onSuccess={handleCalculateSuccess}
      />

      {/* Окно успеха */}
      <SuccessModal
        isOpen={showSuccess}
        message={successMessage}
        onClose={handleCloseSuccess}
      />
    </div>
  );
};

export default Ratings;
