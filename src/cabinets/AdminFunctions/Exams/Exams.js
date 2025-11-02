import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_EXAM_URL } from '../../../Config';
import './Exams.css';
import './ExamsList.css';

export default function Exams() {
    const [examSessions, setExamSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sortBy, setSortBy] = useState('exam_date');
    const [filterExam, setFilterExam] = useState('all');

    useEffect(() => {
        fetchExamSessions();
    }, []);

    const fetchExamSessions = async () => {
        try {
            const response = await axios.get(`${API_EXAM_URL}/get-all-exam-sessions`);
            if (response.data.status && response.data.sessions) {
                setExamSessions(response.data.sessions);
            } else {
                setError('Не удалось загрузить данные экзаменов');
            }
        } catch (err) {
            setError('Ошибка при загрузке данных');
            console.error('Error fetching exam sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Дата не указана';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getGradeColor = (grade) => {
        if (grade >= 5) return '#2ecc71';
        if (grade >= 4) return '#3498db';
        if (grade >= 3) return '#f39c12';
        return '#e74c3c';
    };

    const handleSessionClick = (session) => {
        setSelectedSession(session);
    };

    const handleBackClick = () => {
        setSelectedSession(null);
    };

    // Получаем уникальные экзамены для фильтра
    const uniqueExams = [...new Set(examSessions.map(s => s.exam_name))];
    
    // Фильтруем и сортируем
    const filteredSessions = filterExam === 'all' 
        ? examSessions 
        : examSessions.filter(s => s.exam_name === filterExam);
    
    const sortedSessions = [...filteredSessions].sort((a, b) => {
        if (sortBy === 'student_name') {
            return a.student_name.localeCompare(b.student_name);
        }
        if (sortBy === 'grade') {
            return b.grade - a.grade;
        }
        return new Date(b.exam_date) - new Date(a.exam_date);
    });

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    // Детальный просмотр
    if (selectedSession) {
        return (
            <div className="exam-details-container">
                <button className="back-button" onClick={handleBackClick}>
                    ← Назад к списку
                </button>
                
                <div className="exam-header">
                    <h2>{selectedSession.exam_name}</h2>
                    <p className="exam-date">Дата: {formatDate(selectedSession.exam_date)}</p>
                </div>

                <div className="student-info">
                    <h3>Информация о студенте</h3>
                    <p><strong>Имя:</strong> {selectedSession.student_name}</p>
                    <p><strong>ID:</strong> {selectedSession.student_id}</p>
                </div>

                <div className="exam-summary">
                    <div className="summary-item">
                        <span className="summary-label">Оценка</span>
                        <span 
                            className="summary-value" 
                            style={{ color: getGradeColor(selectedSession.grade) }}
                        >
                            {selectedSession.grade}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Баллы</span>
                        <span className="summary-value">{selectedSession.points}</span>
                    </div>
                    {selectedSession.examinator && (
                        <div className="summary-item">
                            <span className="summary-label">Экзаменатор</span>
                            <span className="summary-value">{selectedSession.examinator}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="exams-admin-container">
            <div className="exams-header">
                <h1>Результаты экзаменов</h1>
                <div className="exams-controls">
                    <select 
                        value={filterExam} 
                        onChange={(e) => setFilterExam(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Все экзамены</option>
                        {uniqueExams.map(exam => (
                            <option key={exam} value={exam}>{exam}</option>
                        ))}
                    </select>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="exam_date">По дате</option>
                        <option value="student_name">По студенту</option>
                        <option value="grade">По оценке</option>
                    </select>
                </div>
            </div>

            {sortedSessions.length > 0 ? (
                <div className="exams-table-container">
                    <table className="exams-table">
                        <thead>
                            <tr>
                                <th>Студент</th>
                                <th>Экзамен</th>
                                <th>Дата</th>
                                <th>Оценка</th>
                                <th>Баллы</th>
                                <th>Экзаменатор</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSessions.map((session) => (
                                <tr key={session.id}>
                                    <td>{session.student_name}</td>
                                    <td>{session.exam_name}</td>
                                    <td>{formatDate(session.exam_date)}</td>
                                    <td>
                                        <span 
                                            className="grade-badge"
                                            style={{ color: getGradeColor(session.grade) }}
                                        >
                                            {session.grade}
                                        </span>
                                    </td>
                                    <td>{session.points}</td>
                                    <td>{session.examinator || '-'}</td>
                                    <td>
                                        <button 
                                            className="view-button"
                                            onClick={() => handleSessionClick(session)}
                                        >
                                            Подробнее
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="no-exams">
                    <p>Нет доступных результатов экзаменов</p>
                </div>
            )}
        </div>
    );
}