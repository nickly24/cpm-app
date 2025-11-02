import React, { useState, useEffect } from 'react';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
import './MyZaps.css';
import { useAuth } from '../../AuthContext';


export default function MyZaps({ onBack, onCreateNew }) {
    const { user } = useAuth();
    const [zaps, setZaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const studentId = user?.id;

    useEffect(() => {
        if (studentId) {
            fetchZaps();
        }
    }, [studentId]);

    const fetchZaps = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.post(`${API_BASE_URL}/api/get-zaps-student`, {
                student_id: studentId
            });

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


    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error">{error}</div>
                <button onClick={onBack}>Назад</button>
            </div>
        );
    }

    return (
        <div className="my-zaps-container">
            <div className="header-actions">
                <h2>Мои запросы на отгул</h2>
                <button onClick={onCreateNew} className="btn-create">
                    + Создать запрос
                </button>
            </div>

            {zaps.length === 0 ? (
                <div className="empty-state">
                    <p>У вас пока нет запросов на отгул</p>
                    <button onClick={onCreateNew} className="btn-create">
                        Создать первый запрос
                    </button>
                </div>
            ) : (
                <div className="zaps-list">
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
                                
                                <div className="zap-id">
                                    Запрос #{zap.id}
                                </div>

                                <div className="zap-text">
                                    {zap.text}
                                </div>

                                {zap.answer && (
                                    <div className="zap-answer">
                                        <strong>Ответ:</strong> {zap.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="footer-actions">
                <button onClick={onBack}>Назад</button>
            </div>
        </div>
    );
}

