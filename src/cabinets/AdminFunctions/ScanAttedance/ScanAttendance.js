import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../../Config';
import { API_EXAM_URL } from '../../../Config';
import axios from '../../../api';
export function ScanAttendance() {
    const [studentId, setStudentId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const studentIdRef = useRef(null);

    // Загрузка истории из localStorage при загрузке
    useEffect(() => {
        const savedHistory = localStorage.getItem('scanHistory');
        if (savedHistory) {
            setScanHistory(JSON.parse(savedHistory));
        }

        // Устанавливаем фокус на поле ввода при загрузке компонента
        const timer = setTimeout(() => {
            studentIdRef.current?.focus();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);
    
    // Фокус на поле ввода при монтировании и после изменения isLoading
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                studentIdRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    // Сохранение истории в localStorage при изменении
    useEffect(() => {
        if (scanHistory.length > 0) {
            localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        }
    }, [scanHistory]);

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!studentId.trim()) return;
        
        setIsLoading(true);
        setNotification(null);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/add-attendance`, {
                studentId: studentId.trim(),
                date: date
            });
            
            const data = response.data;
            
            if (data.status) {
                // Получаем информацию о студенте
                const studentInfoResponse = await axios.post(`${API_BASE_URL}/api/get-class-name-by-studID`, {
                    student_id: studentId.trim()
                });
                
                const studentInfo = studentInfoResponse.data;
                
                if (studentInfo.status && studentInfo.data) {
                    // Добавляем в историю только при успешном добавлении (максимум 10 записей)
                    setScanHistory(prev => {
                        const newHistory = [{
                            id: studentInfo.data.id,
                            name: studentInfo.data.name,
                            class: studentInfo.data.class,
                            date: new Date().toLocaleString(),
                            studentId: studentId.trim()
                        }, ...prev].slice(0, 10);
                        return newHistory;
                    });
                }

                // Показываем уведомление об успехе
                setNotification({ 
                    message: '✅ Успешно добавлено', 
                    isSuccess: true 
                });
                
                // Автоматически скрываем уведомление через 3 секунды
                setTimeout(() => {
                    setNotification(null);
                }, 3000);
            } else {
                setNotification({ 
                    message: data.error || data.message || '❌ Ошибка при добавлении', 
                    isSuccess: false 
                });
                
                // Автоматически скрываем ошибку через 5 секунд
                setTimeout(() => {
                    setNotification(null);
                }, 5000);
            }
        } catch (error) {
            // Обработка ошибок axios
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               error.message || 
                               '❌ Ошибка сети';
            setNotification({ 
                message: errorMessage, 
                isSuccess: false 
            });
            
            // Автоматически скрываем ошибку через 5 секунд
            setTimeout(() => {
                setNotification(null);
            }, 5000);
        } finally {
            setIsLoading(false);
            setStudentId('');
            // Возвращаем фокус на поле ввода после отправки
            setTimeout(() => {
                studentIdRef.current?.focus();
            }, 100);
        }
    };

    // Очистка истории
    const clearHistory = () => {
        setScanHistory([]);
        localStorage.removeItem('scanHistory');
    };

    return (
        <div className="scan-attendance-container">
            <h2>Сканирование посещаемости</h2>
            
            {/* Используем div вместо form, чтобы полностью исключить автоотправку */}
            <div className="scan-form-wrapper">
                <div className="form-group">
                    <label htmlFor="date">Дата:</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="studentId">ID студента:</label>
                    <input
                        ref={studentIdRef}
                        type="text"
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        onKeyDown={(e) => {
                            // Полностью блокируем Enter - сканеры часто добавляют его в конце
                            if (e.key === 'Enter' || e.keyCode === 13) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                return false;
                            }
                        }}
                        onKeyPress={(e) => {
                            // Дополнительная блокировка Enter
                            if (e.key === 'Enter' || e.keyCode === 13) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                return false;
                            }
                        }}
                        onKeyUp={(e) => {
                            // И еще раз для надежности
                            if (e.key === 'Enter' || e.keyCode === 13) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                                return false;
                            }
                        }}
                        onBlur={() => {
                            // Возвращаем фокус на поле, если оно потеряло фокус
                            // Небольшая задержка, чтобы не мешать нормальным действиям
                            setTimeout(() => {
                                if (!isLoading) {
                                    studentIdRef.current?.focus();
                                }
                            }, 200);
                        }}
                        disabled={isLoading}
                        autoComplete="off"
                        autoFocus
                        placeholder="Введите ID студента или отсканируйте штрих-код"
                    />
                </div>
                
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit(e);
                        // Возвращаем фокус на поле ввода после клика
                        setTimeout(() => {
                            studentIdRef.current?.focus();
                        }, 50);
                    }}
                    className="scan-submit-btn"
                    disabled={isLoading || !studentId.trim()}
                >
                    {isLoading ? 'Отправка...' : '📷 Отправить'}
                </button>
                
                {isLoading && <div className="loading-indicator">Загрузка...</div>}
                
                {notification && (
                    <div className={`notification ${notification.isSuccess ? 'success' : 'error'}`}>
                        {notification.message}
                    </div>
                )}
            </div>
            
            {/* История сканирований */}
            <div className="scan-history">
                <div className="scan-history-header">
                    <h3>История сканирований</h3>
                    {scanHistory.length > 0 && (
                        <button onClick={clearHistory} className="clear-history-btn">
                            Очистить историю
                        </button>
                    )}
                </div>
                
                {scanHistory.length === 0 ? (
                    <div className="empty-history">История сканирований пуста</div>
                ) : (
                    <ul className="history-list">
                        {scanHistory.map((item, index) => (
                            <li key={index} className="history-item">
                                <div className="student-info">
                                    <span className="student-name">{item.name}</span>
                                    <span className="student-class">{item.class} класс</span>
                                </div>
                                <div className="scan-details">
                                    <span className="student-id">ID: {item.studentId}</span>
                                    <span className="scan-time">{item.date}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <style>{`
                .scan-attendance-container {
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                h2 {
                    margin-top: 0;
                    color: #333;
                    text-align: center;
                }
                
                .scan-form-wrapper {
                    display: flex;
                    flex-direction: column;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #555;
                }
                
                input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                    box-sizing: border-box;
                }
                
                input[type="date"] {
                    padding: 9px;
                }
                
                .scan-submit-btn {
                    width: 100%;
                    padding: 12px 20px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.1s;
                    margin-top: 10px;
                    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
                }
                
                .scan-submit-btn:hover:not(:disabled) {
                    background: #5568d3;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
                }
                
                .scan-submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                
                .scan-submit-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                
                .loading-indicator {
                    margin: 10px 0;
                    color: #666;
                    text-align: center;
                }
                
                .notification {
                    padding: 12px;
                    margin: 15px 0;
                    border-radius: 4px;
                    text-align: center;
                    font-weight: bold;
                }
                
                .notification.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .notification.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                /* Стили для истории сканирований */
                .scan-history {
                    margin-top: 30px;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }
                
                .scan-history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .scan-history-header h3 {
                    margin: 0;
                    color: #333;
                }
                
                .clear-history-btn {
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                }
                
                .clear-history-btn:hover {
                    background: #ff5252;
                }
                
                .empty-history {
                    text-align: center;
                    color: #666;
                    padding: 15px;
                    background: #f0f0f0;
                    border-radius: 4px;
                }
                
                .history-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .history-item {
                    background: white;
                    padding: 12px 15px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .student-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                
                .student-name {
                    font-weight: bold;
                }
                
                .student-class {
                    color: #666;
                    font-size: 14px;
                }
                
                .scan-details {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #888;
                }
            `}</style>
        </div>
    );
}