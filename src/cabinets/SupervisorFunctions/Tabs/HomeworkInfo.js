import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import './Homework.css';
const HomeworkInfo = ({ studentId }) => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const homeworksPerPage = 5; // Увеличил количество заданий на странице для широкого экрана

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        if (!studentId) {
          throw new Error('ID студента не получен');
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/get-homeworks-student`,
          { studentId: studentId },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.status && Array.isArray(response.data?.res)) {
          const filteredHomeworks = response.data.res
            .map(hw => ({
              ...hw,
              deadline: new Date(hw.deadline)
            }))
            .sort((a, b) => b.deadline - a.deadline);
          
          setHomeworks(filteredHomeworks);
        } else {
          throw new Error('Неверный формат данных');
        }
      } catch (err) {
        setError(err.message || 'Ошибка загрузки заданий');
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeworks();
  }, [studentId]);

  // Пагинация
  const indexOfLastHomework = currentPage * homeworksPerPage;
  const indexOfFirstHomework = indexOfLastHomework - homeworksPerPage;
  const currentHomeworks = homeworks.slice(indexOfFirstHomework, indexOfLastHomework);
  const totalPages = Math.ceil(homeworks.length / homeworksPerPage);

  // Стилизация карточек по статусу
  const getCardColor = (deadline, status) => {
    if (status.includes('сдано')) return 'submitted';
    
    const today = new Date();
    const timeDiff = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays > 0) return 'pending';
    if (diffDays >= -5) return 'warning';
    if (diffDays >= -20) return 'danger';
    return 'critical';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  if (loading) return <div className="hw-loading">Загрузка заданий...</div>;
  if (error) return <div className="hw-error">{error}</div>;

  return (
    <div className="hw-container">
        <div className="hw-legend">
        <div className="hw-legend-item">
          <span className="hw-legend-color submitted"></span>
          <span>Сдано</span>
        </div>
        <div className="hw-legend-item">
          <span className="hw-legend-color pending"></span>
          <span>В процессе</span>
        </div>
        <div className="hw-legend-item">
          <span className="hw-legend-color warning"></span>
          <span>Дедлайн близко (≤5 дней)</span>
        </div>
        <div className="hw-legend-item">
          <span className="hw-legend-color danger"></span>
          <span>Просрочено (≤20 дней)</span>
        </div>
        <div className="hw-legend-item">
          <span className="hw-legend-color critical"></span>
          <span>Сильно просрочено ( более 20 дней)</span>
        </div>
      </div>
      <div className="hw-grid">
        {currentHomeworks.map(hw => {
          const cardClass = getCardColor(hw.deadline, hw.status);
          const isSubmitted = hw.status.includes('сдано');
          
          return (
            <div key={hw.homework_id} className={`hw-card ${cardClass}`}>
              <div className="hw-card-header">
                <span className="hw-type">{hw.homework_type}</span>
                <h3 className="hw-title">{hw.homework_name}</h3>
              </div>
              
              <div className="hw-deadline">
                <strong>Дедлайн:</strong> {formatDate(hw.deadline)}
              </div>
              
              <div className="hw-status">
                {isSubmitted ? (
                  <span className="hw-result">Оценка: <strong>{hw.result}</strong> баллов</span>
                ) : (
                  <span className="hw-status-text">
                    {hw.status && hw.status.includes('FFFF') ? 'ДЗ не сделано' : hw.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {homeworks.length > homeworksPerPage && (
        <div className="hw-pagination">
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1}
            className="hw-pagination-button"
          >
            &lt; Назад
          </button>
          
          <div className="hw-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`hw-page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            className="hw-pagination-button"
          >
            Вперед &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeworkInfo;