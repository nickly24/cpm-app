import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Progress.css'; // Создадим отдельный файл для стилей
import { API_EXAM_URL } from '../../Config';
const Progress = ({ onBack }) => {
  const studentName = localStorage.getItem('full_name');
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const studentId = localStorage.getItem('id'); // Предполагаем, что ID хранится в localStorage
        const response = await axios.post(`${API_EXAM_URL}/student-rating`, {
          student_id: studentId
        });
        
        if (response.data.status && response.data.data.length > 0) {
          setRatings(response.data.data[0]);
        } else {
          setError('Данные об успеваемости не найдены');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Error fetching ratings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  // Функция для отрисовки столбцов диаграммы
  const renderBar = (value, max = 100, label) => {
    const percentage = Math.min(value, max);
    return (
      <div className="bar-container">
        <div className="bar-label">{label}</div>
        <div className="bar">
          <div 
            className="bar-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
          <span className="bar-value">{value}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="content-section">
      <div className="welcome-section">
        <h2>Добро пожаловать, {studentName}! 👋</h2>
      </div>
      
      
    </div>
  );
};

export default Progress;