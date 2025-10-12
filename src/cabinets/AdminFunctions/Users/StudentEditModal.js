import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';

const StudentEditModal = ({ student, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState(student.full_name || '');
  const [classNumber, setClassNumber] = useState(student.class?.toString() || '9');
  const [tgName, setTgName] = useState(student.tg_name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Блокируем прокрутку body при открытии модального окна
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!fullName.trim()) {
      setError('Введите ФИО студента');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        student_id: student.id
      };
      
      // Добавляем только измененные поля
      if (fullName.trim() !== student.full_name) {
        requestData.full_name = fullName.trim();
      }
      
      if (parseInt(classNumber) !== student.class) {
        requestData.class = parseInt(classNumber);
      }
      
      if (tgName.trim() !== (student.tg_name || '')) {
        requestData.tg_name = tgName.trim() || null;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/edit-student`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        onSuccess(response.data.student_data);
        onClose();
      } else {
        throw new Error(response.data.error || 'Ошибка при обновлении студента');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e8ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '22px', 
              fontWeight: '700', 
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✏️ Редактирование студента
            </h2>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '14px', 
              color: '#7f8c8d' 
            }}>
              ID: {student.id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#95a5a6',
              padding: '4px 8px',
              lineHeight: '1',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f8f9fa';
              e.target.style.color = '#2c3e50';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#95a5a6';
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ФИО */}
            <div>
              <label 
                htmlFor="edit-fullName"
                style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#4a5568',
                  marginBottom: '8px' 
                }}
              >
                👤 ФИО студента
              </label>
              <input
                type="text"
                id="edit-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Введите полное имя студента"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8ecef',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Montserrat, sans-serif',
                  transition: 'all 0.3s ease',
                  background: '#f8f9fa',
                  boxSizing: 'border-box'
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

            {/* Класс */}
            <div>
              <label 
                htmlFor="edit-classNumber"
                style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#4a5568',
                  marginBottom: '8px' 
                }}
              >
                🎓 Класс
              </label>
              <select
                id="edit-classNumber"
                value={classNumber}
                onChange={(e) => setClassNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8ecef',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Montserrat, sans-serif',
                  background: '#f8f9fa',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                required
              >
                <option value="9">9 класс</option>
                <option value="10">10 класс</option>
                <option value="11">11 класс</option>
              </select>
            </div>

            {/* Telegram */}
            <div>
              <label 
                htmlFor="edit-tgName"
                style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#4a5568',
                  marginBottom: '8px' 
                }}
              >
                💬 Telegram никнейм <span style={{ color: '#95a5a6', fontWeight: '400' }}>(необязательно)</span>
              </label>
              <input
                type="text"
                id="edit-tgName"
                value={tgName}
                onChange={(e) => setTgName(e.target.value)}
                placeholder="@username или username"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e8ecef',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Montserrat, sans-serif',
                  transition: 'all 0.3s ease',
                  background: '#f8f9fa',
                  boxSizing: 'border-box'
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

            {/* Error */}
            {error && (
              <div style={{
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

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Отмена
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {isSubmitting ? '🔄 Сохранение...' : '✓ Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditModal;

