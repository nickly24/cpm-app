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

function ZapDetail({ zap, onBack, onRefresh }) {
    const [processing, setProcessing] = useState(false);
    const [action, setAction] = useState('apr'); // 'apr' or 'dec'
    const [answer, setAnswer] = useState('');
    const [dates, setDates] = useState('');
    const [showDatesInput, setShowDatesInput] = useState(false);

    const handleProcess = async () => {
        if (!answer.trim()) {
            alert('Укажите ответ');
            return;
        }

        if (action === 'apr' && !dates.trim()) {
            alert('Укажите даты для привязки');
            return;
        }

        setProcessing(true);
        try {
            const datesArray = action === 'apr' 
                ? dates.split(',').map(d => d.trim()).filter(d => d)
                : [];

            const response = await axios.post(`${API_BASE_URL}/api/process-zap`, {
                zap_id: zap.zap.id,
                status: action,
                answer: answer,
                dates: datesArray
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
                    <p><strong>Дата создания:</strong> {new Date(zap.zap.created_at).toLocaleString('ru-RU')}</p>
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
                                const isPDF = img.img_base64 && img.img_base64.includes('data:application/pdf');
                                return (
                                    <div key={index} className="image-item">
                                        {img.img_base64 && (
                                            isPDF ? (
                                                <iframe
                                                    src={img.img_base64}
                                                    style={{
                                                        width: '100%',
                                                        height: '300px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px'
                                                    }}
                                                    title={`PDF ${index + 1}`}
                                                />
                                            ) : (
                                                <img 
                                                    src={img.img_base64} 
                                                    alt={`Фото ${index + 1}`}
                                                    onClick={() => window.open(img.img_base64, '_blank')}
                                                />
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="detail-section">
                    <h3>Обработка запроса</h3>
                    
                    <div className="action-buttons">
                        <button 
                            className={action === 'apr' ? 'btn-action active' : 'btn-action'}
                            onClick={() => {
                                setAction('apr');
                                setShowDatesInput(true);
                            }}
                        >
                            Одобрить
                        </button>
                        <button 
                            className={action === 'dec' ? 'btn-action active' : 'btn-action'}
                            onClick={() => {
                                setAction('dec');
                                setShowDatesInput(false);
                            }}
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

                    {showDatesInput && (
                        <div className="form-group">
                            <label>Даты для привязки (через запятую, формат YYYY-MM-DD):</label>
                            <input
                                type="text"
                                value={dates}
                                onChange={(e) => setDates(e.target.value)}
                                placeholder="2025-01-15, 2025-01-16"
                            />
                            <div className="help-text">
                                Укажите даты, к которым будет привязан отгул
                            </div>
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
            </div>
        </div>
    );
}

