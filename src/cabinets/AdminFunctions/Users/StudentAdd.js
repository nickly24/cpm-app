import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';

const StudentAdd = () => {
  const [fullName, setFullName] = useState('');
  const [classNumber, setClassNumber] = useState('9');
  const [tgName, setTgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    
    if (!fullName.trim()) {
      setError('Введите ФИО студента');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        full_name: fullName.trim(),
        class: parseInt(classNumber)
      };
      
      // Добавляем tg_name только если оно заполнено
      if (tgName.trim()) {
        requestData.tg_name = tgName.trim();
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/add-student`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        const studentData = response.data.student_data;
        setSuccessData({
          fullName: studentData.full_name,
          login: studentData.login,
          password: studentData.password,
          studentId: studentData.student_id,
          class: studentData.class,
          tgName: studentData.tg_name
        });
        setFullName('');
        setClassNumber('9');
        setTgName('');
      } else {
        throw new Error(response.data.error || 'Ошибка при создании студента');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} скопирован в буфер обмена!`);
    });
  };

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">➕ Добавление студента</h2>
        <p className="section-subtitle">Создание нового студента с автоматической генерацией логина и пароля</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Form Card */}
        <div className="item-card">
          <div className="card-header">
            <div className="card-avatar" style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
              👨‍🎓
            </div>
            <div className="card-info">
              <h3 className="card-title">Новый студент</h3>
              <p className="card-subtitle">Заполните данные студента</p>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label 
                  htmlFor="fullName"
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
                  id="fullName"
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

              <div>
                <label 
                  htmlFor="classNumber"
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
                  id="classNumber"
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
                    cursor: 'pointer'
                  }}
                  required
                >
                  <option value="9">9 класс</option>
                  <option value="10">10 класс</option>
                  <option value="11">11 класс</option>
                </select>
              </div>

              <div>
                <label 
                  htmlFor="tgName"
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
                  id="tgName"
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

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? '🔄 Создание...' : '✓ Создать студента'}
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
          </div>
        </div>

        {/* Success Card */}
        {successData && (
          <div className="item-card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <div className="card-avatar" style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                ✓
              </div>
              <div className="card-info">
                <h3 className="card-title">Студент успешно создан!</h3>
                <p className="card-subtitle">{successData.fullName} • {successData.class} класс • ID: {successData.studentId}</p>
              </div>
            </div>

            <div className="card-body">
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#4a5568',
                  marginBottom: '12px'
                }}>
                  📋 Данные для входа:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>
                        Логин
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#2c3e50',
                        fontFamily: 'monospace'
                      }}>
                        {successData.login}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(successData.login, 'Логин')}
                      className="btn btn-secondary btn-sm"
                    >
                      📋 Копировать
                    </button>
                  </div>

                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '4px' }}>
                        Пароль
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#2c3e50',
                        fontFamily: 'monospace'
                      }}>
                        {successData.password}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(successData.password, 'Пароль')}
                      className="btn btn-secondary btn-sm"
                    >
                      📋 Копировать
                    </button>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                background: '#fff3cd',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#856404',
                display: 'flex',
                alignItems: 'start',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <div>
                  <strong>Важно:</strong> Сохраните эти данные! Они больше не будут отображены.
                  Передайте логин и пароль студенту для входа в систему.
                </div>
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
              >
                ✓ Понятно, создать еще
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAdd;

