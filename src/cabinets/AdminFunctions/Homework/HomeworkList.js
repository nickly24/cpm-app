import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';

const HomeworkList = ({ refreshFlag }) => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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
  }, [refreshFlag]);

  const handleDelete = async (homeworkId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это задание?')) return;
    
    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/api/delete-homework',
        { homeworkId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        setHomeworks(prev => prev.filter(hw => hw.id !== homeworkId));
      } else {
        throw new Error(response.data.message || 'Ошибка при удалении');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Нет дедлайна';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const getTypeIcon = (type) => {
    return type === 'ДЗНВ' ? '📘' : '📙';
  };

  const getTypeColor = (type) => {
    return type === 'ДЗНВ' ? '#3498db' : '#e67e22';
  };

  // Фильтрация
  const filteredHomeworks = homeworks.filter(hw => {
    const matchesSearch = hw.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || hw.type === filterType;
    return matchesSearch && matchesType;
  });

  // Пагинация
  const totalPages = Math.ceil(filteredHomeworks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHomeworks = filteredHomeworks.slice(startIndex, endIndex);

  // Сброс страницы при изменении фильтров
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // Статистика
  const stats = {
    total: homeworks.length,
    дзнв: homeworks.filter(hw => hw.type === 'ДЗНВ').length,
    ов: homeworks.filter(hw => hw.type === 'ОВ').length,
    withDeadline: homeworks.filter(hw => hw.deadline).length
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Загрузка заданий...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3 className="empty-title">Ошибка загрузки</h3>
        <p className="empty-text">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      {homeworks.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Всего заданий</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">📘 ДЗНВ</p>
            <h3 className="stat-value">{stats.дзнв}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">📙 ОВ</p>
            <h3 className="stat-value">{stats.ов}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">С дедлайном</p>
            <h3 className="stat-value">{stats.withDeadline}</h3>
          </div>
        </div>
      )}

      {/* Filters */}
      {homeworks.length > 0 && (
        <div className="filters-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Поиск по названию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="button-group">
            <button
              onClick={() => setFilterType('all')}
              className={`filter-button ${filterType === 'all' ? 'active' : ''}`}
            >
              Все задания
            </button>
            <button
              onClick={() => setFilterType('ДЗНВ')}
              className={`filter-button ${filterType === 'ДЗНВ' ? 'active' : ''}`}
            >
              📘 ДЗНВ
            </button>
            <button
              onClick={() => setFilterType('ОВ')}
              className={`filter-button ${filterType === 'ОВ' ? 'active' : ''}`}
            >
              📙 ОВ
            </button>
          </div>
        </div>
      )}

      {/* Homework Cards */}
      {filteredHomeworks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {homeworks.length === 0 ? '📝' : '🔍'}
          </div>
          <h3 className="empty-title">
            {homeworks.length === 0 ? 'Нет заданий' : 'Ничего не найдено'}
          </h3>
          <p className="empty-text">
            {homeworks.length === 0 
              ? 'Добавьте первое домашнее задание, нажав кнопку "Добавить задание"'
              : `По запросу "${searchTerm}" ничего не найдено`
            }
          </p>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {currentHomeworks.map(hw => {
              const typeColor = getTypeColor(hw.type);
              const hasDeadline = !!hw.deadline;

              return (
                <div key={hw.id} className="item-card">
                  <div className="card-header">
                    <div 
                      className="card-avatar" 
                      style={{ background: `${typeColor}20`, color: typeColor, border: `2px solid ${typeColor}` }}
                    >
                      {getTypeIcon(hw.type)}
                    </div>
                    <div className="card-info">
                      <h3 className="card-title">{hw.name}</h3>
                      <p className="card-subtitle">ID: {hw.id}</p>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-meta">
                      <span 
                        className="meta-badge" 
                        style={{ background: `${typeColor}20`, color: typeColor }}
                      >
                        {hw.type}
                      </span>
                      {hasDeadline ? (
                        <span className="meta-badge">
                          📅 {formatDate(hw.deadline)}
                        </span>
                      ) : (
                        <span className="meta-badge" style={{ color: '#95a5a6' }}>
                          ∞ Без дедлайна
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button 
                      onClick={() => handleDelete(hw.id)}
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%' }}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                ← Назад
              </button>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Показываем первую, последнюю, текущую и соседние страницы
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} style={{ padding: '8px', color: '#7f8c8d' }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Вперед →
              </button>
            </div>
          )}

          {/* Info */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px', 
            color: '#7f8c8d', 
            fontSize: '14px' 
          }}>
            Показано {startIndex + 1}-{Math.min(endIndex, filteredHomeworks.length)} из {filteredHomeworks.length}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeworkList;