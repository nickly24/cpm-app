import React, { useState, useEffect } from 'react';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
const HomeworkStudents = ({ homeworkId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingSubmittedSession, setEditingSubmittedSession] = useState(null);
  const [datePass, setDatePass] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const proctorId = localStorage.getItem('id');

  useEffect(() => {
    if (!homeworkId || !proctorId) return;

    const fetchSessions = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/get-homework-sessions`,
          {
            proctorId: proctorId,
            homeworkId: homeworkId
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.status && Array.isArray(response.data?.res)) {
          setSessions(response.data.res);
        } else {
          throw new Error('Неверный формат данных');
        }
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных');
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [homeworkId, proctorId, success]);

  const handlePassHomework = async () => {
    if (!datePass || !editingSession) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/pass_homework`,
        {
          sessionId: editingSession.id || null,
          datePass: datePass,
          studentId: editingSession.student_id,
          homeworkId: homeworkId
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Обновляем локальное состояние с новыми данными
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.student_id === editingSession.student_id 
            ? {
                ...session,
                status: 1,
                date_pass: datePass,
                result: response.data.result || 100,
                id: session.id || `temp_${session.student_id}` // Убеждаемся что есть ID
              }
            : session
        )
      );
      
      setSuccess(`ДЗ для ${editingSession.student_full_name} успешно занесено!`);
      setEditingSession(null);
      setDatePass('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке данных');
      console.error('Ошибка:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditHomework = async () => {
    if (!datePass || !editingSubmittedSession) return;
    
    setSubmitting(true);
    try {
      const requestData = {
        sessionId: editingSubmittedSession.id,
        datePass: datePass,
        status: 1
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/edit-homework-session`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Обновляем локальное состояние с новыми данными
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === editingSubmittedSession.id 
            ? {
                ...session,
                date_pass: datePass,
                result: response.data.result || session.result // Используем новый результат если есть
              }
            : session
        )
      );
      
      setSuccess(`ДЗ для ${editingSubmittedSession.student_full_name} успешно отредактировано!`);
      setEditingSubmittedSession(null);
      setDatePass('');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при редактировании данных');
      console.error('Ошибка:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-students">Загрузка студентов...</div>;
  if (error) return <div className="error-students">{error}</div>;

  return (
    <div className="students-sessions-list">
      {success && <div className="success-message">{success}</div>}
      
      {sessions.map(session => (
        <div 
          key={session.id || session.student_id} 
          className={`session-card ${session.status === 0 ? 'not-submitted' : 'submitted'}`}
        >
          <div className="student-info">
            <span className="student-name">{session.student_full_name}</span>
            <span className="student-id">ID: {session.student_id}</span>
          </div>
          
          {session.status === 1 ? (
            <div className="result">
              <div>Баллы: {session.result}</div>
              <div className="date-pass">Дата сдачи: {session.date_pass ? new Date(session.date_pass).toLocaleDateString('ru-RU') : 'Не указана'}</div>
              
              {editingSubmittedSession?.student_id === session.student_id ? (
                <div className="edit-form">
                  <input
                    type="date"
                    value={datePass}
                    onChange={(e) => setDatePass(e.target.value)}
                    className="date-input"
                    min="2000-01-01"
                    max="2100-12-31"
                    placeholder="Выберите дату сдачи"
                  />
                  <button 
                    onClick={handleEditHomework}
                    disabled={submitting || !datePass}
                    className="edit-btn"
                  >
                    {submitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingSubmittedSession(null);
                      setDatePass('');
                    }}
                    className="cancel-btn"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setEditingSubmittedSession(session);
                    setDatePass(session.date_pass || '');
                  }}
                  className="edit-btn"
                >
                  Редактировать дату
                </button>
              )}
            </div>
          ) : (
            <div className="not-submitted-actions">
              <div className="status">Не сдал</div>
              
              {editingSession?.student_id === session.student_id ? (
                <div className="pass-form">
                  <input
                    type="date"
                    value={datePass}
                    onChange={(e) => setDatePass(e.target.value)}
                    className="date-input"
                    min="2000-01-01"
                    max="2100-12-31"
                  />
                  <button 
                    onClick={handlePassHomework}
                    disabled={submitting || !datePass}
                    className="submit-btn"
                  >
                    {submitting ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setEditingSession(session)}
                  className="submit-btn"
                >
                  Занести ДЗ
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HomeworkStudents;