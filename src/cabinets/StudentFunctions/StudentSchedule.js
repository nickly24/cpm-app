import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../Config';
import './StudentSchedule.css';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const getDayColor = (dayIndex) => {
    const colors = [
      '#3498db', // Понедельник - синий
      '#2ecc71', // Вторник - зеленый
      '#e74c3c', // Среда - красный
      '#f39c12', // Четверг - оранжевый
      '#9b59b6', // Пятница - фиолетовый
      '#1abc9c', // Суббота - бирюзовый
      '#34495e'  // Воскресенье - темно-серый
    ];
    return colors[dayIndex];
  };

  return (
    <div className="student-schedule">
      <div className="schedule-header">
        <h2>📚 Расписание занятий</h2>
        <p>Ваше еженедельное расписание</p>
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
          <p>Загрузка расписания...</p>
        </div>
      )}

      {/* Schedule Grid */}
      {!loading && (
        <div className="schedule-grid">
          {daysOrder.map((day, index) => (
            <div key={day} className="schedule-day">
              <div 
                className="day-header"
                style={{ backgroundColor: getDayColor(index) }}
              >
                <h3 className="day-title">{day}</h3>
                <span className="lesson-count">
                  {groupedSchedule[day]?.length || 0}
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

      {/* Refresh Button */}
      {!loading && (
        <div className="schedule-actions">
          <button 
            onClick={fetchSchedule}
            className="refresh-button"
          >
            🔄 Обновить расписание
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentSchedule;
