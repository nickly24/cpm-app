import React, { useState } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';

const HomeworkAdd = ({ onHomeworkAdded }) => {
  const [homeworkName, setHomeworkName] = useState('');
  const [homeworkType, setHomeworkType] = useState('ДЗНВ');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const formatDateInput = (value) => {
    // Удаляем все нецифровые символы
    const numbers = value.replace(/\D/g, '');
    
    let formatted = '';
    
    // Форматируем по маске дд.мм.гггг
    for (let i = 0; i < numbers.length; i++) {
      if (i === 2 || i === 4) {
        formatted += '.';
      }
      if (i >= 8) break; // Ограничиваем 8 цифрами (2 д + 2 м + 4 г)
      formatted += numbers[i];
    }
    
    return formatted;
  };

  const handleDateChange = (e) => {
    const input = e.target.value;
    
    // Если пользователь стер символ - оставляем как есть
    if (input.length < deadline.length) {
      setDeadline(input);
      return;
    }
    
    // Форматируем ввод
    setDeadline(formatDateInput(input));
  };

  const validateDate = (date) => {
    if (!date) return true; // Пустая дата - валидна
    
    const parts = date.split('.');
    if (parts.length !== 3 || parts.some(part => !part)) return false;
    
    const [day, month, year] = parts;
    
    // Проверяем числа
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1 || dayNum > 31) return false;
    
    // Простая проверка дней в месяце
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum > daysInMonth) return false;
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!homeworkName.trim()) {
      setError('Название задания не может быть пустым');
      return;
    }

    if (deadline && !validateDate(deadline)) {
      setError('Введите корректную дату в формате дд.мм.гггг');
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedDeadline = deadline 
        ? deadline.split('.').reverse().join('-')
        : null;

      const response = await axios.post(
        `${API_BASE_URL}/api/create-homework`,
        {
          homeworkName: homeworkName.trim(),
          homeworkType: homeworkType,
          deadline: formattedDeadline
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        setSuccessMessage(`Задание "${homeworkName}" успешно добавлено!`);
        setHomeworkName('');
        setHomeworkType('ДЗНВ');
        setDeadline('');
        if (onHomeworkAdded) onHomeworkAdded(); 
      } else {
        throw new Error(response.data.message || 'Ошибка при создании задания');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="item-card">
      <div className="card-header">
        <div className="card-avatar" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          ✏️
        </div>
        <div className="card-info">
          <h3 className="card-title">Создание нового задания</h3>
          <p className="card-subtitle">Заполните форму для добавления ДЗ</p>
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label 
              htmlFor="homeworkName"
              style={{ 
                display: 'block', 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#4a5568',
                marginBottom: '8px' 
              }}
            >
              📚 Название задания
            </label>
            <input
              type="text"
              id="homeworkName"
              value={homeworkName}
              onChange={(e) => setHomeworkName(e.target.value)}
              placeholder="Введите название задания"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e8ecef',
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.3s ease',
                background: '#f8f9fa'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = 'white';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e8ecef';
                e.target.style.background = '#f8f9fa';
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label 
                htmlFor="homeworkType"
                style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#4a5568',
                  marginBottom: '8px' 
                }}
              >
                🏷️ Тип задания
              </label>
              <select
                id="homeworkType"
                value={homeworkType}
                onChange={(e) => setHomeworkType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8ecef',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Montserrat, sans-serif',
                  background: '#f8f9fa',
                  cursor: 'pointer'
                }}
                required
              >
                <option value="ДЗНВ">ДЗНВ</option>
                <option value="ОВ">ОВ</option>
              </select>
            </div>

            <div>
              <label 
                htmlFor="deadline"
                style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#4a5568',
                  marginBottom: '8px' 
                }}
              >
                📅 Дедлайн (необязательно)
              </label>
              <input
                type="text"
                id="deadline"
                value={deadline}
                onChange={handleDateChange}
                placeholder="дд.мм.гггг"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8ecef',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Montserrat, sans-serif',
                  background: '#f8f9fa'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e8ecef';
                  e.target.style.background = '#f8f9fa';
                }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ marginTop: '8px' }}
          >
            {isSubmitting ? '🔄 Добавление...' : '✓ Добавить задание'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fee',
            borderLeft: '4px solid #e74c3c',
            borderRadius: '6px',
            color: '#c0392b',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        {successMessage && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#d4edda',
            borderLeft: '4px solid #2ecc71',
            borderRadius: '6px',
            color: '#27ae60',
            fontSize: '14px'
          }}>
            ✓ {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkAdd;