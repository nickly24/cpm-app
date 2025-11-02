import React, { useState, useEffect } from 'react';
import axios from '../../api';
import HomeworkStudents from './HomeworkStudents';
import { API_BASE_URL } from '../../Config';
import './HomeworkList.css';

const HomeworkList = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [homeworksPerPage] = useState(6);

  const toggleHomework = (id) => {
    if (expandedId !== id) {
      setExpandedId(id);
    }
  };

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/get-homeworks`);
        
        if (response.data?.status && Array.isArray(response.data?.res)) {
          setHomeworks(response.data.res);
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
  }, []);

  // Получаем текущие задания
  const indexOfLastHomework = currentPage * homeworksPerPage;
  const indexOfFirstHomework = indexOfLastHomework - homeworksPerPage;
  const currentHomeworks = homeworks.slice(indexOfFirstHomework, indexOfLastHomework);

  // Меняем страницу
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Функция для определения цвета дедлайна
  const getDeadlineColor = (deadline) => {
    if (!deadline) return '#95a5a6'; // Серый для заданий без дедлайна
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '#e74c3c'; // Красный для просроченных
    if (diffDays <= 2) return '#f39c12'; // Оранжевый для истекающих (1-2 дня)
    if (diffDays <= 7) return '#f1c40f'; // Желтый для скоро истекающих (3-7 дней)
    return '#27ae60'; // Зеленый для актуальных
  };

  // Функция для определения текста дедлайна
  const getDeadlineText = (deadline) => {
    if (!deadline) return 'Не указан';
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Просрочено на ${Math.abs(diffDays)} дн.`;
    if (diffDays === 0) return 'Истекает сегодня';
    if (diffDays === 1) return 'Истекает завтра';
    if (diffDays <= 7) return `Осталось ${diffDays} дн.`;
    return new Date(deadline).toLocaleDateString('ru-RU');
  };

  if (loading) return <div className="loading">Загрузка заданий...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
    <div className="homework-list">
      
        {currentHomeworks.map(hw => (
          <div 
            key={hw.id} 
            className={`homework-card ${expandedId === hw.id ? 'expanded' : ''}`}
            onClick={() => toggleHomework(hw.id)}
          >
            {/* Остальное содержимое карточки без изменений */}
            <div className="hw-main-content">
              <div className="hw-header">
                <span className="hw-type">{hw.type}</span>
                <h3 className="hw-title">{hw.name}</h3>
                <div className="hw-deadline">
                  📅 Дедлайн: {hw.deadline ? new Date(hw.deadline).toLocaleDateString('ru-RU') : 'Не указан'}
                </div>
              </div>
              <div className={`expand-icon ${expandedId === hw.id ? 'expanded' : ''}`}>
                {expandedId === hw.id ? '▲' : '▼'}
              </div>
              
              {expandedId === hw.id && (
                <button 
                  className="close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(null);
                  }}
                >
                  Закрыть окно
                </button>
              )}
            </div>
            
            {expandedId === hw.id && (
              <div className="hw-details">
                <HomeworkStudents homeworkId={hw.id} />
              </div>
            )}
          </div>
        ))}
      

      
    </div>
    {/* Пагинация */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(homeworks.length / homeworksPerPage) }).map((_, index) => (
          <button
            key={index}
            onClick={() => paginate(index + 1)}
            className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </>
  );
};

export default HomeworkList;