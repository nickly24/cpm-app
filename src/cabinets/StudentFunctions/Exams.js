import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExamsList.css';
import { API_EXAM_URL } from '../../Config';

const Exams = () => {
  const [examSessions, setExamSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const studentId = localStorage.getItem('id');

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

  const handleSessionClick = (session) => {
    setSelectedSession(session);
  };

  const handleBackClick = () => {
    setSelectedSession(null);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Если выбран сессия, показываем детали
  if (selectedSession) {
    return (
      <div className="exam-details-container">
        <button className="back-button" onClick={handleBackClick}>
          ← Назад к списку экзаменов
        </button>
        
        <div className="exam-header">
          <h2>{selectedSession.exam_name}</h2>
          <p className="exam-date">Дата: {formatDate(selectedSession.exam_date)}</p>
        </div>

        <div className="exam-summary">
          <div className="summary-item">
            <span className="summary-label">Оценка</span>
            <span 
              className="summary-value" 
              style={{ color: getGradeColor(selectedSession.grade) }}
            >
              {selectedSession.grade}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Баллы</span>
            <span className="summary-value">{selectedSession.points}</span>
          </div>
          {selectedSession.examinator && (
            <div className="summary-item">
              <span className="summary-label">Экзаменатор</span>
              <span className="summary-value">{selectedSession.examinator}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="exams-container">
      <h1>Мои экзамены</h1>
      {examSessions.length > 0 ? (
        <div className="exams-list">
          {examSessions.map((session) => (
            <div 
              key={session.id} 
              className="exam-card"
              onClick={() => handleSessionClick(session)}
            >
              <div className="exam-card-content">
                <h3>{session.exam_name}</h3>
                <p className="exam-card-date">Дата: {formatDate(session.exam_date)}</p>
                <div className="exam-card-grade" style={{ color: getGradeColor(session.grade) }}>
                  Оценка: {session.grade}
                </div>
                <div className="exam-card-points">
                  Баллы: {session.points}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-exams">
          <p>У вас пока нет сданных экзаменов</p>
        </div>
      )}
    </div>
  );
};

export default Exams;