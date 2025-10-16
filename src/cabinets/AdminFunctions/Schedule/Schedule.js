import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';
import './Schedule.css';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [error, setError] = useState('');

  // Загружаем расписание при монтировании компонента
  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/schedule`);
      
      if (response.data.status) {
        setSchedule(response.data.schedule || []);
      } else {
        setError(response.data.error || 'Ошибка при загрузке расписания');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async (lessonData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/schedule`, lessonData);
      
      if (response.data.status) {
        await fetchSchedule(); // Перезагружаем расписание
        setShowAddModal(false);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || err.message || 'Ошибка сервера' 
      };
    }
  };

  const handleEditLesson = async (lessonId, lessonData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/schedule/${lessonId}`, lessonData);
      
      if (response.data.status) {
        await fetchSchedule(); // Перезагружаем расписание
        setEditingLesson(null);
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || err.message || 'Ошибка сервера' 
      };
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Вы уверены, что хотите удалить это занятие?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/schedule/${lessonId}`);
        
        if (response.data.status) {
          await fetchSchedule(); // Перезагружаем расписание
        } else {
          setError(response.data.error || 'Ошибка при удалении занятия');
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Ошибка сервера');
      }
    }
  };

  // Группируем занятия по дням недели
  const groupedSchedule = schedule.reduce((acc, lesson) => {
    const day = lesson.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lesson);
    return acc;
  }, {});

  const daysOrder = [
    'Понедельник', 'Вторник', 'Среда', 'Четверг', 
    'Пятница', 'Суббота', 'Воскресенье'
  ];

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">📚 Расписание занятий</h2>
        <p className="section-subtitle">Управление расписанием занятий по дням недели</p>
      </div>

      {/* Actions */}
      <div className="schedule-actions">
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          ➕ Добавить занятие
        </button>
        <button 
          onClick={fetchSchedule}
          className="btn btn-secondary"
          disabled={loading}
        >
          {loading ? '🔄 Загрузка...' : '🔄 Обновить'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Загрузка расписания...</p>
        </div>
      )}

      {/* Schedule Grid */}
      {!loading && (
        <div className="schedule-grid">
          {daysOrder.map(day => (
            <div key={day} className="schedule-day">
              <div className="day-header">
                <h3 className="day-title">{day}</h3>
                <span className="lesson-count">
                  {groupedSchedule[day]?.length || 0} занятий
                </span>
              </div>
              
              <div className="lessons-list">
                {groupedSchedule[day]?.length > 0 ? (
                  groupedSchedule[day].map(lesson => (
                    <div key={lesson._id} className="lesson-card">
                      <div className="lesson-time">
                        {lesson.start_time} - {lesson.end_time}
                      </div>
                      <div className="lesson-content">
                        <h4 className="lesson-name">{lesson.lesson_name}</h4>
                        <p className="lesson-teacher">👨‍🏫 {lesson.teacher_name}</p>
                        <p className="lesson-location">📍 {lesson.location}</p>
                      </div>
                      <div className="lesson-actions">
                        <button
                          onClick={() => setEditingLesson(lesson)}
                          className="btn btn-sm btn-primary"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson._id)}
                          className="btn btn-sm btn-danger"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-lessons">
                    <p>Занятий нет</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddModal && (
        <LessonModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddLesson}
          title="Добавить занятие"
        />
      )}

      {/* Edit Lesson Modal */}
      {editingLesson && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={(data) => handleEditLesson(editingLesson._id, data)}
          title="Редактировать занятие"
        />
      )}
    </div>
  );
};

// Компонент модального окна для добавления/редактирования занятия
const LessonModal = ({ lesson, onClose, onSave, title }) => {
  const [formData, setFormData] = useState({
    day_of_week: lesson?.day_of_week || 'Понедельник',
    start_time: lesson?.start_time || '09:00',
    end_time: lesson?.end_time || '10:30',
    lesson_name: lesson?.lesson_name || '',
    teacher_name: lesson?.teacher_name || '',
    location: lesson?.location || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.lesson_name.trim()) {
      setError('Название занятия обязательно');
      return;
    }
    
    if (!formData.teacher_name.trim()) {
      setError('Имя преподавателя обязательно');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Место проведения обязательно');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setError('Время окончания должно быть больше времени начала');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await onSave(formData);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      setError('Ошибка при сохранении');
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = [
    'Понедельник', 'Вторник', 'Среда', 'Четверг', 
    'Пятница', 'Суббота', 'Воскресенье'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>День недели</label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
              required
            >
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Время начала</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Время окончания</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Название занятия</label>
            <input
              type="text"
              value={formData.lesson_name}
              onChange={(e) => setFormData({...formData, lesson_name: e.target.value})}
              placeholder="Например: Математика"
              required
            />
          </div>

          <div className="form-group">
            <label>Преподаватель</label>
            <input
              type="text"
              value={formData.teacher_name}
              onChange={(e) => setFormData({...formData, teacher_name: e.target.value})}
              placeholder="Например: Иванов И.И."
              required
            />
          </div>

          <div className="form-group">
            <label>Место проведения</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Например: Аудитория 101"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? '🔄 Сохранение...' : '✓ Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Schedule;
