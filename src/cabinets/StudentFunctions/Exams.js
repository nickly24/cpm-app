import React, { useState, useEffect } from 'react';
import axios from '../../api';
import './ExamsList.css';
import { API_EXAM_URL } from '../../Config';
import { useAuth } from '../../AuthContext';

const Exams = () => {
  const { user } = useAuth();
  const [examSessions, setExamSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // date, grade, points
  const [filterGrade, setFilterGrade] = useState('all'); // all, 5, 4, 3, 2

  const studentId = user?.id;

  useEffect(() => {
    const fetchExamSessions = async () => {
      try {
        if (!studentId) {
          setError('ID студента не найден');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_EXAM_URL}/get-student-exam-sessions/${studentId}`);
        if (response.data.status && response.data.sessions) {
          setExamSessions(response.data.sessions);
        } else {
          setError('Не удалось загрузить данные экзаменов');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Error fetching exam sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamSessions();
  }, [studentId]);

  useEffect(() => {
    // Применяем фильтры и сортировку
    let filtered = [...examSessions];

    // Фильтр по оценке
    if (filterGrade !== 'all') {
      filtered = filtered.filter(session => session.grade === parseInt(filterGrade));
    }

    // Сортировка
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.exam_date) - new Date(a.exam_date);
      } else if (sortBy === 'grade') {
        return b.grade - a.grade;
      } else if (sortBy === 'points') {
        return b.points - a.points;
      }
      return 0;
    });

    setFilteredSessions(filtered);
  }, [examSessions, sortBy, filterGrade]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Дата не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getGradeColor = (grade) => {
    if (grade >= 5) return '#2ecc71';
    if (grade >= 4) return '#3498db';
    if (grade >= 3) return '#f39c12';
    return '#e74c3c';
  };

  const getGradeBadge = (grade) => {
    if (grade >= 5) return 'Отлично';
    if (grade >= 4) return 'Хорошо';
    if (grade >= 3) return 'Удовлетворительно';
    return 'Неудовлетворительно';
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  const handleBackClick = () => {
    setSelectedSession(null);
  };

  const getTotalPoints = () => {
    return examSessions.reduce((sum, session) => sum + session.points, 0);
  };

  const getAverageGrade = () => {
    if (examSessions.length === 0) return 0;
    const sum = examSessions.reduce((sum, session) => sum + session.grade, 0);
    return (sum / examSessions.length).toFixed(2);
  };

  if (loading) {
    return (
      <div className="student-exams-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка экзаменов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-exams-page">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Детальный просмотр экзамена
  if (selectedSession) {
    return (
      <div className="student-exams-page">
        <div className="exam-detail-view">
          <button className="back-btn" onClick={handleBackClick}>
            <span className="back-icon">←</span>
            Назад к списку
          </button>
          
          <div className="exam-detail-card">
            <div className="exam-detail-header">
              <div className="exam-title-section">
                <h2>{selectedSession.exam_name}</h2>
                <p className="exam-date-text">
                  <span className="calendar-icon">📅</span>
                  {formatDate(selectedSession.exam_date)}
                </p>
              </div>
            </div>

            <div className="exam-stats-grid">
              <div className="stat-card grade-stat">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <span className="stat-label">Оценка</span>
                  <span 
                    className="stat-value"
                    style={{ color: getGradeColor(selectedSession.grade) }}
                  >
                    {selectedSession.grade}
                  </span>
                  <span className="stat-badge">{getGradeBadge(selectedSession.grade)}</span>
                </div>
              </div>

              <div className="stat-card points-stat">
                <div className="stat-icon">💯</div>
                <div className="stat-content">
                  <span className="stat-label">Баллы</span>
                  <span className="stat-value">{selectedSession.points}</span>
                  <span className="stat-badge">из 6 максимальных</span>
                </div>
              </div>

              {selectedSession.examinator && (
                <div className="stat-card examinator-stat">
                  <div className="stat-icon">👨‍🏫</div>
                  <div className="stat-content">
                    <span className="stat-label">Экзаменатор</span>
                    <span className="stat-value-small">{selectedSession.examinator}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-exams-page">
      {/* Заголовок и статистика */}
      <div className="exams-header-section">
        <div className="header-title">
          <h1>🎓 Мои экзамены</h1>
          <p>Просмотр результатов сданных экзаменов</p>
        </div>
        
        {examSessions.length > 0 && (
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{examSessions.length}</span>
              <span className="stat-text">Экзаменов сдано</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{getAverageGrade()}</span>
              <span className="stat-text">Средний балл</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{getTotalPoints()}</span>
              <span className="stat-text">Всего баллов</span>
            </div>
          </div>
        )}
      </div>

      {/* Фильтры и сортировка */}
      {examSessions.length > 0 && (
        <div className="exams-controls-bar">
          <div className="control-group">
            <label>Оценка:</label>
            <select 
              value={filterGrade} 
              onChange={(e) => setFilterGrade(e.target.value)}
              className="filter-select"
            >
              <option value="all">Все</option>
              <option value="5">5 (Отлично)</option>
              <option value="4">4 (Хорошо)</option>
              <option value="3">3 (Удовлетворительно)</option>
              <option value="2">2 (Неудовлетворительно)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Сортировка:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">По дате</option>
              <option value="grade">По оценке</option>
              <option value="points">По баллам</option>
            </select>
          </div>
        </div>
      )}

      {/* Список экзаменов */}
      {examSessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Пока нет сданных экзаменов</h3>
          <p>После сдачи экзаменов, их результаты появятся здесь</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Нет результатов по выбранным фильтрам</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
        </div>
      ) : (
        <div className="exams-grid">
          {filteredSessions.map((session) => (
            <div 
              key={session.id} 
              className="exam-card-modern"
              onClick={() => handleSessionClick(session)}
            >
              <div className="exam-card-header">
                <div className="exam-card-icon" style={{ background: getGradeColor(session.grade) + '20' }}>
                  <span style={{ color: getGradeColor(session.grade) }}>📄</span>
                </div>
                <div className="exam-card-badge" style={{ color: getGradeColor(session.grade), background: getGradeColor(session.grade) + '15' }}>
                  Оценка: {session.grade}
                </div>
              </div>
              
              <div className="exam-card-body">
                <h3>{session.exam_name}</h3>
                <p className="exam-card-meta">
                  <span>📅</span> {formatDate(session.exam_date)}
                </p>
              </div>

              <div className="exam-card-footer">
                <div className="exam-card-metric">
                  <span className="metric-label">Баллы:</span>
                  <span className="metric-value">{session.points}/6</span>
                </div>
                {session.examinator && (
                  <div className="exam-card-metric">
                    <span className="metric-label">Преподаватель:</span>
                    <span className="metric-value-small">{session.examinator}</span>
                  </div>
                )}
              </div>

              <div className="exam-card-hover-effect">
                <span>Нажмите для подробностей →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Exams;
