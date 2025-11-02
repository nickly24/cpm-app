import React, { useState, useEffect } from 'react';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
import './StudentHomeworkList.modern.css';
import { useAuth } from '../../AuthContext';

const StudentHomeworkList = () => {
  const { user } = useAuth();
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentId = user?.id;
  const homeworksPerPage = 6;
  const [statusFilter, setStatusFilter] = useState('all'); // all | done | undone
  const [typeFilter, setTypeFilter] = useState('all'); // all | ДЗНВ | ОВ

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

  // Фильтрация
  const filteredHomeworks = homeworks.filter(hw => {
    const isSubmitted = (hw.status || '').includes('сдано');
    const isFFFF = (hw.status || '').includes('FFFF');
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'done' ? isSubmitted : !isSubmitted || isFFFF;
    const matchesType = typeFilter === 'all' ? true : (hw.homework_type === typeFilter);
    return matchesStatus && matchesType;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredHomeworks.length / homeworksPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastHomework = safeCurrentPage * homeworksPerPage;
  const indexOfFirstHomework = indexOfLastHomework - homeworksPerPage;
  const currentHomeworks = filteredHomeworks.slice(indexOfFirstHomework, indexOfLastHomework);

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
    if (safeCurrentPage > 1) setCurrentPage(safeCurrentPage - 1);
  };

  const goToNextPage = () => {
    if (safeCurrentPage < totalPages) setCurrentPage(safeCurrentPage + 1);
  };

  const getPaginationItems = (total, current) => {
    const items = [];
    
    // На мобильных показываем меньше страниц
    const isMobile = window.innerWidth <= 768;
    const maxMobileItems = 5;
    
    if (isMobile && total > maxMobileItems) {
      // Мобильная версия - показываем текущую страницу и соседние
      const start = Math.max(1, Math.min(current - 2, total - maxMobileItems + 1));
      const end = Math.min(total, start + maxMobileItems - 1);
      
      for (let i = start; i <= end; i++) {
        items.push(i);
      }
      
      // Добавляем первую и последнюю если они не в видимом диапазоне
      if (start > 1) {
        items.unshift(1);
        if (start > 2) items.splice(1, 0, '...');
      }
      if (end < total) {
        items.push(total);
        if (end < total - 1) items.splice(-1, 0, '...');
      }
    } else {
      // Десктоп версия
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          items.push(i);
        }
      } else {
        items.push(1);
        
        if (current <= 4) {
          items.push(2, 3, 4, 5);
          items.push('...');
          items.push(total);
        } else if (current >= total - 3) {
          items.push('...');
          items.push(total - 4, total - 3, total - 2, total - 1, total);
        } else {
          items.push('...');
          items.push(current - 1, current, current + 1);
          items.push('...');
          items.push(total);
        }
      }
    }
    
    return items;
  };

  if (loading) return <div className="sc-hw-loading">Загрузка заданий...</div>;
  if (error) return <div className="sc-hw-error">{error}</div>;

  return (
    <div className="sc-hw-container">
      <div className="sc-hw-toolbar">
        <div className="sc-hw-breadcrumbs">
          <span className="sc-hw-crumb">Домашние задания</span>
          {typeFilter !== 'all' && <span className="sc-hw-crumb sep">/</span>}
          {typeFilter !== 'all' && <span className="sc-hw-crumb active">{typeFilter}</span>}
        </div>
        <div className="sc-hw-filters">
          <select
            className="sc-hw-select"
            value={statusFilter}
            onChange={(e) => { setCurrentPage(1); setStatusFilter(e.target.value); }}
          >
            <option value="all">Все статусы</option>
            <option value="done">Сделано</option>
            <option value="undone">Не сделано</option>
          </select>
          <select
            className="sc-hw-select"
            value={typeFilter}
            onChange={(e) => { setCurrentPage(1); setTypeFilter(e.target.value); }}
          >
            <option value="all">Все типы</option>
            <option value="ДЗНВ">ДЗНВ</option>
            <option value="ОВ">ОВ</option>
          </select>
        </div>
      </div>
      <div className="sc-hw-grid">
        {currentHomeworks.map(hw => {
          const cardClass = getCardColor(hw.deadline, hw.status);
          const isSubmitted = hw.status.includes('сдано');
          const isNoStatus = hw.status && hw.status.includes('FFFF');
          const typeIcon = hw.homework_type?.toLowerCase().includes('тест') ? '📊' : '📝';
          const statusBadge = isSubmitted ? '✅ Сделано' : (isNoStatus ? '❌ Не сделано' : hw.status || 'В процессе');
          
          return (
            <div key={hw.homework_id} className={`sc-hw-card sc-${cardClass}`}>
              <div className="sc-hw-card-header">
                <div className="sc-hw-avatar">
                  {typeIcon}
                </div>
                <div className="sc-hw-headings">
                  <h3 className="sc-hw-title">{hw.homework_name}</h3>
                </div>
              </div>

              <div className="sc-hw-meta">
                <span className="sc-hw-badge sc-hw-type">{hw.homework_type}</span>
                <span className="sc-hw-badge sc-hw-deadline">📅 {formatDate(hw.deadline)}</span>
                <span className={`sc-hw-badge sc-hw-status ${isSubmitted ? 'sc-done' : 'sc-undone'}`}>{statusBadge}</span>
              </div>

              {isSubmitted && (
                <div className="sc-hw-score">Оценка: {parseInt(hw.result)} баллов</div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="sc-hw-pagination">
          <button 
            onClick={goToPrevPage} 
          disabled={safeCurrentPage === 1}
            className="sc-hw-page-btn"
          >
            ← Назад
          </button>
          
          <div className="sc-hw-page-numbers">
            {getPaginationItems(totalPages, safeCurrentPage).map((item, idx) => (
              item === '...'
                ? <span key={`e-${idx}`} className="sc-hw-ellipsis">…</span>
                : (
                  <button
                    key={item}
                    onClick={() => paginate(item)}
                    className={`sc-hw-page-number ${safeCurrentPage === item ? 'active' : ''}`}
                  >
                    {item}
                  </button>
                )
            ))}
          </div>
          
          <button 
            onClick={goToNextPage} 
          disabled={safeCurrentPage === totalPages}
            className="sc-hw-page-btn"
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentHomeworkList;