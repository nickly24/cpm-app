import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../Config';
const StudentHomeworkList = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentId = localStorage.getItem('id');
  const homeworksPerPage = 3;

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
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
          // Сортируем все задания по дате (убрали фильтрацию FFFF)
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

  // Получаем текущие задания для страницы
  const indexOfLastHomework = currentPage * homeworksPerPage;
  const indexOfFirstHomework = indexOfLastHomework - homeworksPerPage;
  const currentHomeworks = homeworks.slice(indexOfFirstHomework, indexOfLastHomework);
  const totalPages = Math.ceil(homeworks.length / homeworksPerPage);

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

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) return <div className="loading">Загрузка заданий...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="homework-lis">
      <div className="homework-l">
        {currentHomeworks.map(hw => {
          const cardClass = getCardColor(hw.deadline, hw.status);
          const isSubmitted = hw.status.includes('сдано');
          
          return (
            <div key={hw.homework_id} className={`homework-card ${cardClass}`}>
              <div className="hw-header">
                <span className="hw-type">{hw.homework_type}</span>
                <h3 className="hw-title">{hw.homework_name}</h3>
              </div>
              
              <div className="hw-deadline">
                Дедлайн: {formatDate(hw.deadline)}
              </div>
              
              <div className="hw-status">
                {isSubmitted ? (
                  <span className="result">Оценка: {parseInt(hw.result)} баллов</span>
                ) : (
                  <span className="status">
                    {hw.status && hw.status.includes('FFFF') ? 'ДЗ не сделано' : hw.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {homeworks.length > homeworksPerPage && (
        <div className="pagination">
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage === 1}
            className="pagination-button prev"
          >
            Назад
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          
          <button 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages}
            className="pagination-button next"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentHomeworkList;