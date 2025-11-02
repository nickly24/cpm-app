import React, { useEffect, useState } from 'react';
import axios from '../../api';
import './StudentInfo.css';
import { API_BASE_URL } from '../../Config';
import { API_EXAM_URL } from '../../Config';
import AttendanceInfo from './Tabs/AttendanceInfo';
import ExamsInfo from './Tabs/ExamsInfo';
import HomeworkInfo from './Tabs/HomeworkInfo';
import TestsInfo from './Tabs/TestsInfo';
// Пустые компоненты (пока заглушки)



export default function StudentInfo({ studentId, onBack }) {
    const [student, setStudent] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('attendance');

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                setLoading(true);
                const studentResponse = await axios.get(`${API_BASE_URL}/api/get-students`);
                const foundStudent = studentResponse.data.res.find(s => s.student_id === studentId);
                
                if (!foundStudent) throw new Error('Студент не найден');
                
                setStudent(foundStudent);
                const performanceResponse = await axios.post(
                    `${API_EXAM_URL}/perfomance-by-student`,
                    { student_id: studentId }
                );
                setPerformance(performanceResponse.data.data);
                setLoading(false);
            } catch (err) {
                console.error('Ошибка при загрузке данных студента:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [studentId]);

    const renderTabContent = () => {
        switch(activeTab) {
            case 'attendance':
                return <AttendanceInfo studentId={studentId} />;
            case 'homework':
                return <HomeworkInfo studentId={studentId} />;
            case 'exams':
                return <ExamsInfo studentId={studentId} />;
            case 'tests':
                return <TestsInfo studentId={studentId} />;
            default:
                return <AttendanceInfo studentId={studentId} />;
        }
    };

    if (loading) return <div className="loading">Загрузка данных...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!student) return <div className="error">Данные о студенте не найдены</div>;

    return (
        <div className="student-info-container">
            <button className="back-button" onClick={onBack}>
                ← Назад к списку
            </button>
            
            <div className="info-section2">
                <h2>{student.full_name}</h2>
                <p className='rerr'><strong>Класс:</strong> {student.class}</p>
                <p><strong>ID студента:</strong> {student.student_id}</p>
            </div>

            {/* Краткая сводка по всем разделам */}
            <div className="summary-container">
                <div className="summary-item">
                    <span className="summary-label">Посещаемость:</span>
                    <span className="summary-value">{performance?.attendance ?? '—'}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Домашние задания:</span>
                    <span className="summary-value">
                        {performance?.homework?.completed ?? 0}/{performance?.homework?.total ?? 0}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Экзамены:</span>
                    <span className="summary-value">
                        {performance?.control_works?.average_score ?? '—'} 
                    </span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Тесты:</span>
                    <span className="summary-value">
                        {performance?.tests?.average_score ?? '—'} 
                    </span>
                </div>
            </div>

            <div className="tabs-container">
                <button 
                    className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attendance')}
                >
                    Посещаемость
                </button>
                <button 
                    className={`tab-button ${activeTab === 'homework' ? 'active' : ''}`}
                    onClick={() => setActiveTab('homework')}
                >
                    Домашние задания
                </button>
                <button 
                    className={`tab-button ${activeTab === 'exams' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exams')}
                >
                    Экзамены
                </button>
                <button 
                    className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tests')}
                >
                    Тесты
                </button>
            </div>

            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
}