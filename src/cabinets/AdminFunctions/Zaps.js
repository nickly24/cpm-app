import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../Config';
import './Zaps.css';

export default function Zaps() {
    const [zaps, setZaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedZap, setSelectedZap] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'set', 'apr', 'dec'

    useEffect(() => {
        fetchZaps();
    }, [filter]);

    const fetchZaps = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const url = filter === 'all' 
                ? `${API_BASE_URL}/api/get-all-zaps`
                : `${API_BASE_URL}/api/get-all-zaps?status=${filter}`;
            
            const response = await axios.get(url);

            if (response.data.status) {
                setZaps(response.data.zaps);
            } else {
                setError('Ошибка при загрузке запросов');
            }
        } catch (err) {
            setError('Ошибка при загрузке данных');
            console.error('Ошибка:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'set':
                return { label: 'На рассмотрении', className: 'status-pending' };
            case 'apr':
                return { label: 'Одобрено', className: 'status-approved' };
            case 'dec':
                return { label: 'Отклонено', className: 'status-rejected' };
            default:
                return { label: status, className: '' };
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewDetails = async (zapId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/get-zap/${zapId}`);
            if (response.data.status) {
                setSelectedZap(response.data);
            }
        } catch (err) {
            alert('Ошибка при загрузке деталей запроса');
            console.error(err);
        }
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (selectedZap) {
        return (
            <ZapDetail 
                zap={selectedZap} 
                onBack={() => setSelectedZap(null)}
                onRefresh={fetchZaps}
            />
        );
    }

    return (
        <div className="zaps-admin-container">
            <div className="header">
                <h2>Обработка запросов на отгул</h2>
                <div className="filter-group">
                    <label>Фильтр:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">Все</option>
                        <option value="set">На рассмотрении</option>
                        <option value="apr">Одобрено</option>
                        <option value="dec">Отклонено</option>
                    </select>
                </div>
            </div>

            {zaps.length === 0 ? (
                <div className="empty-state">
                    Нет запросов
                </div>
            ) : (
                <div className="zaps-grid">
                    {zaps.map((zap) => {
                        const statusInfo = getStatusLabel(zap.status);
                        return (
                            <div key={zap.id} className="zap-card">
                                <div className="zap-header">
                                    <span className="zap-id">Запрос #{zap.id}</span>
                                    <span className={`status ${statusInfo.className}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                                
                                <div className="student-name">
                                    {zap.full_name}
                                </div>

                                <div className="zap-date">
                                    {formatDate(zap.created_at)}
                                </div>

                                <div className="zap-text-preview">
                                    {zap.text.length > 100 
                                        ? zap.text.substring(0, 100) + '...'
                                        : zap.text}
                                </div>

                                <button 
                                    className="btn-view"
                                    onClick={() => handleViewDetails(zap.id)}
                                >
                                    Просмотреть
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CalendarDatePicker({ onDatesChange, initialDates = [] }) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDates, setSelectedDates] = useState(initialDates);

    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handleDateClick = (day) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        setSelectedDates(prev => {
            const index = prev.indexOf(dateStr);
            if (index > -1) {
                return prev.filter(d => d !== dateStr);
            } else {
                return [...prev, dateStr].sort();
            }
        });
    };

    useEffect(() => {
        onDatesChange(selectedDates);
    }, [selectedDates, onDatesChange]);

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];
        
        // Пустые ячейки для начала месяца
        for (let i = 0; i < firstDay - 1; i++) {
            days.push(null);
        }
        
        // Дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        
        return days;
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <div className="date-picker-calendar">
            <div className="calendar-header">
                <button onClick={prevMonth}>←</button>
                <span>{monthNames[currentMonth]} {currentYear}</span>
                <button onClick={nextMonth}>→</button>
            </div>
            <div className="calendar-weekdays">
                <div>Пн</div>
                <div>Вт</div>
                <div>Ср</div>
                <div>Чт</div>
                <div>Пт</div>
                <div>Сб</div>
                <div>Вс</div>
            </div>
            <div className="calendar-grid">
                {renderCalendar().map((day, index) => {
                    if (day === null) {
                        return <div key={index} className="calendar-day empty"></div>;
                    }
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = selectedDates.includes(dateStr);
                    const isSunday = new Date(currentYear, currentMonth, day).getDay() === 0;
                    
                    return (
                        <div
                            key={index}
                            className={`calendar-day ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
                            onClick={() => !isSunday && handleDateClick(day)}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
            <div className="selected-dates-list">
                <strong>Выбранные даты:</strong>
                {selectedDates.length > 0 ? (
                    <div className="dates-tags">
                        {selectedDates.map(date => (
                            <span key={date} className="date-tag">{date}</span>
                        ))}
                    </div>
                ) : (
                    <span style={{ color: '#666' }}>Не выбрано</span>
                )}
            </div>
        </div>
    );
}

function FileViewerModal({ file, currentIndex, totalFiles, onClose, onNext, onPrev }) {
    const [zoom, setZoom] = useState(1);
    const isPDF = file && (file.file_type === 'application/pdf' || (file.img_base64 && file.img_base64.includes('data:application/pdf')));

    const handleZoomIn = () => {
        if (zoom < 3) {
            setZoom(zoom + 0.25);
        }
    };

    const handleZoomOut = () => {
        if (zoom > 0.5) {
            setZoom(zoom - 0.25);
        }
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    return (
        <div className="file-viewer-overlay" onClick={onClose}>
            <div className={`file-viewer-modal ${isPDF ? 'pdf-viewer' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="file-viewer-header">
                    <span>Файл {currentIndex + 1} из {totalFiles}</span>
                    {!isPDF && (
                        <div className="zoom-controls">
                            <button onClick={handleZoomOut} disabled={zoom <= 0.5}>−</button>
                            <span>{Math.round(zoom * 100)}%</span>
                            <button onClick={handleZoomIn} disabled={zoom >= 3}>+</button>
                            <button onClick={handleResetZoom}>Reset</button>
                        </div>
                    )}
                    {isPDF && (
                        <div className="pdf-info">PDF документ</div>
                    )}
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="file-viewer-content">
                    {isPDF ? (
                        <iframe
                            src={file.img_base64}
                            style={{
                                width: '100%',
                                height: 'calc(100vh - 180px)',
                                border: 'none'
                            }}
                            title="PDF Viewer"
                        />
                    ) : (
                        <img 
                            src={file.img_base64}
                            alt="File"
                            style={{
                                transform: `scale(${zoom})`,
                                transition: 'transform 0.3s',
                                maxWidth: '100%',
                                height: 'auto'
                            }}
                        />
                    )}
                </div>
                <div className="file-viewer-footer">
                    <button 
                        onClick={onPrev}
                        disabled={currentIndex === 0}
                        className="nav-btn"
                    >
                        ← Предыдущий
                    </button>
                    <button 
                        onClick={onNext}
                        disabled={currentIndex === totalFiles - 1}
                        className="nav-btn"
                    >
                        Следующий →
                    </button>
                </div>
            </div>
        </div>
    );
}

function ZapDetail({ zap, onBack, onRefresh }) {
    const [processing, setProcessing] = useState(false);
    const [action, setAction] = useState('apr'); // 'apr' or 'dec'
    const [answer, setAnswer] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [viewingFile, setViewingFile] = useState(null); // {index, file}
    
    const isProcessed = zap.zap.status !== 'set'; // Проверяем, обработан ли уже запрос

    const handleProcess = async () => {
        if (!answer.trim()) {
            alert('Укажите ответ');
            return;
        }

        if (action === 'apr' && selectedDates.length === 0) {
            alert('Выберите даты для привязки');
            return;
        }

        setProcessing(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/process-zap`, {
                zap_id: zap.zap.id,
                status: action,
                answer: answer,
                dates: selectedDates
            });

            if (response.data.status) {
                alert('Запрос успешно обработан');
                onRefresh();
                onBack();
            } else {
                alert('Ошибка: ' + response.data.error);
            }
        } catch (err) {
            alert('Ошибка при обработке запроса');
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="zap-detail">
            <div className="detail-header">
                <h2>Детали запроса #{zap.zap.id}</h2>
                <button onClick={onBack}>Назад к списку</button>
            </div>

            <div className="detail-content">
                <div className="detail-section">
                    <h3>Информация о студенте</h3>
                    <p><strong>Имя:</strong> {zap.zap.full_name}</p>
                    <p><strong>ID:</strong> {zap.zap.student_id}</p>
                </div>

                <div className="detail-section">
                    <h3>Текст запроса</h3>
                    <div className="zap-text">{zap.zap.text}</div>
                </div>

                {zap.images && zap.images.length > 0 && (
                    <div className="detail-section">
                        <h3>Прикрепленные файлы</h3>
                        <div className="images-grid">
                            {zap.images.map((img, index) => {
                                const isPDF = img.file_type === 'application/pdf' || (img.img_base64 && img.img_base64.includes('data:application/pdf'));
                                return (
                                    <div 
                                        key={index} 
                                        className="image-item"
                                        onClick={() => setViewingFile({ index, file: img })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {img.img_base64 && (
                                            isPDF ? (
                                                <div className="pdf-thumbnail">
                                                    <div className="pdf-icon">📄</div>
                                                    <div className="pdf-label">PDF документ</div>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={img.img_base64} 
                                                    alt={`Фото ${index + 1}`}
                                                />
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewingFile && (
                    <FileViewerModal 
                        file={viewingFile.file}
                        currentIndex={viewingFile.index}
                        totalFiles={zap.images.length}
                        onClose={() => setViewingFile(null)}
                        onNext={() => {
                            if (viewingFile.index < zap.images.length - 1) {
                                setViewingFile({
                                    index: viewingFile.index + 1,
                                    file: zap.images[viewingFile.index + 1]
                                });
                            }
                        }}
                        onPrev={() => {
                            if (viewingFile.index > 0) {
                                setViewingFile({
                                    index: viewingFile.index - 1,
                                    file: zap.images[viewingFile.index - 1]
                                });
                            }
                        }}
                    />
                )}

                {zap.zap.answer && (
                    <div className="detail-section">
                        <h3>Ответ на запрос</h3>
                        <div className="zap-answer-display">
                            <p><strong>Статус:</strong> {zap.zap.status === 'apr' ? '✅ Одобрено' : '❌ Отклонено'}</p>
                            <p><strong>Ответ:</strong></p>
                            <div className="zap-text">{zap.zap.answer}</div>
                        </div>
                    </div>
                )}

                {!isProcessed && (
                    <div className="detail-section">
                        <h3>Обработка запроса</h3>
                        
                        <div className="action-buttons">
                            <button 
                                className={action === 'apr' ? 'btn-action active' : 'btn-action'}
                                onClick={() => setAction('apr')}
                            >
                                Одобрить
                            </button>
                            <button 
                                className={action === 'dec' ? 'btn-action active' : 'btn-action'}
                                onClick={() => setAction('dec')}
                            >
                                Отклонить
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Ваш ответ:</label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                rows="4"
                                placeholder="Введите ответ..."
                            />
                        </div>

                        {action === 'apr' && (
                            <div className="form-group">
                                <label>Выберите даты для привязки:</label>
                                <CalendarDatePicker 
                                    onDatesChange={setSelectedDates}
                                    initialDates={selectedDates}
                                />
                            </div>
                        )}

                        <button 
                            className="btn-process"
                            onClick={handleProcess}
                            disabled={processing}
                        >
                            {processing ? 'Обработка...' : 'Обработать запрос'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

