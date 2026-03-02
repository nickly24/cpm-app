import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../../../Config';
import axios from '../../../api';
import { CameraScanModal } from './CameraScanModal';

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function formatDayLabel(d) {
    if (!d || !d.date) return '';
    const date = new Date(d.date);
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return `${day} ${month} (${weekdays[date.getDay()]})${d.comment ? ' — ' + d.comment : ''}`;
}

export function ScanAttendance() {
    const [step, setStep] = useState(1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [classDays, setClassDays] = useState([]);
    const [loadingDays, setLoadingDays] = useState(false);
    const [selectedClassDayId, setSelectedClassDayId] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const [studentId, setStudentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [cameraModalOpen, setCameraModalOpen] = useState(false);
    const studentIdRef = useRef(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('scanHistory');
        if (savedHistory) setScanHistory(JSON.parse(savedHistory));
    }, []);

    useEffect(() => {
        if (!studentIdRef.current || isLoading) return;
        const t = setTimeout(() => studentIdRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, [isLoading, step, selectedClassDayId]);

    useEffect(() => {
        if (scanHistory.length > 0) localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    }, [scanHistory]);

    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const loadDays = async () => {
        setLoadingDays(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/class-days`, {
                params: { date_from: dateFrom, date_to: dateTo },
            });
            if (res.data.status && res.data.class_days) {
                setClassDays(res.data.class_days);
                setSelectedClassDayId(null);
                setSelectedDay(null);
                setStep(2);
            } else {
                setClassDays([]);
                setStep(2);
            }
        } catch (_) {
            setClassDays([]);
            setStep(2);
        }
        setLoadingDays(false);
    };

    const chooseDay = (d) => {
        setSelectedClassDayId(d.id);
        setSelectedDay(d);
        setStep(3);
        setTimeout(() => studentIdRef.current?.focus(), 200);
    };

    const backToMonths = () => {
        setStep(1);
        setSelectedClassDayId(null);
        setSelectedDay(null);
    };

    const backToDays = () => {
        setStep(2);
        setSelectedClassDayId(null);
        setSelectedDay(null);
    };

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!studentId.trim() || !selectedClassDayId) return;

        setIsLoading(true);
        setNotification(null);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/class-days/${selectedClassDayId}/attendance`,
                { student_id: parseInt(studentId.trim(), 10), attendance_type_id: 1 }
            );
            const data = response.data;

            if (data.status) {
                try {
                    const studentInfoResponse = await axios.post(`${API_BASE_URL}/api/get-class-name-by-studID`, {
                        student_id: studentId.trim(),
                    });
                    const studentInfo = studentInfoResponse.data;
                    if (studentInfo.status && studentInfo.data) {
                        setScanHistory((prev) => [
                            {
                                id: studentInfo.data.id,
                                name: studentInfo.data.name,
                                class: studentInfo.data.class,
                                date: new Date().toLocaleString(),
                                studentId: studentId.trim(),
                            },
                            ...prev,
                        ].slice(0, 10));
                    }
                } catch (_) {}
                setNotification({ message: '✅ Успешно добавлено', isSuccess: true });
                setTimeout(() => setNotification(null), 3000);
                setStudentId('');
                setTimeout(() => studentIdRef.current?.focus(), 100);
            } else {
                setNotification({ message: data.error || 'Ошибка', isSuccess: false });
                setTimeout(() => setNotification(null), 5000);
            }
        } catch (error) {
            const msg = error.response?.data?.error || error.message || 'Ошибка сети';
            setNotification({ message: msg, isSuccess: false });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        setScanHistory([]);
        localStorage.removeItem('scanHistory');
    };

    return (
        <div className="scan-attendance-container">
            <h2>Сканирование посещаемости</h2>

            {/* Шаг 1: Год и месяц */}
            {step === 1 && (
                <div className="scan-step scan-step-period">
                    <p className="step-label">Выберите месяц и год</p>
                    <div className="period-fields">
                        <label>
                            <span>Год</span>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                            >
                                {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Месяц</span>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                            >
                                {MONTH_NAMES.map((name, i) => (
                                    <option key={i} value={i + 1}>{name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <button
                        type="button"
                        className="scan-btn-primary"
                        onClick={loadDays}
                        disabled={loadingDays}
                    >
                        {loadingDays ? 'Загрузка…' : 'Показать дни занятий'}
                    </button>
                </div>
            )}

            {/* Шаг 2: Список дней за выбранный месяц */}
            {step === 2 && (
                <div className="scan-step scan-step-days">
                    <button type="button" className="scan-back" onClick={backToMonths}>
                        ← Другой месяц / год
                    </button>
                    <p className="step-label">Выберите день занятий</p>
                    {classDays.length === 0 ? (
                        <p className="scan-empty">В выбранном периоде нет дней занятий. Создайте день в разделе «Посещаемость».</p>
                    ) : (
                        <div className="scan-days-list">
                            {classDays.map((d) => (
                                <button
                                    type="button"
                                    key={d.id}
                                    className="scan-day-card"
                                    onClick={() => chooseDay(d)}
                                >
                                    {formatDayLabel(d)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Шаг 3: Выбран день — сканирование ID */}
            {step === 3 && selectedDay && (
                <div className="scan-step scan-step-scan">
                    <button type="button" className="scan-back" onClick={backToDays}>
                        ← Выбрать другой день
                    </button>
                    <div className="scan-selected-day">
                        День: <strong>{formatDayLabel(selectedDay)}</strong>
                    </div>

                    <div className="scan-form-wrapper">
                        <div className="form-group">
                            <label htmlFor="studentId">ID студента</label>
                            <input
                                ref={studentIdRef}
                                type="text"
                                id="studentId"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.keyCode === 13) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSubmit(e);
                                    }
                                }}
                                disabled={isLoading}
                                autoComplete="off"
                                placeholder="Введите ID или отсканируйте штрих-код"
                            />
                        </div>
                        <button
                            type="button"
                            className="scan-submit-btn"
                            onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                            disabled={isLoading || !studentId.trim()}
                        >
                            {isLoading ? 'Отправка…' : 'Отправить'}
                        </button>
                        <button
                            type="button"
                            className="scan-camera-btn"
                            onClick={() => setCameraModalOpen(true)}
                            disabled={isLoading}
                        >
                            Сканирование камерой
                        </button>
                        {notification && (
                            <div className={`notification ${notification.isSuccess ? 'success' : 'error'}`}>
                                {notification.message}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <CameraScanModal
                open={cameraModalOpen}
                onClose={() => setCameraModalOpen(false)}
                classDayId={selectedClassDayId}
                onSuccess={async ({ studentId: sid }) => {
                    try {
                        const studentInfoResponse = await axios.post(`${API_BASE_URL}/api/get-class-name-by-studID`, {
                            student_id: String(sid),
                        });
                        const studentInfo = studentInfoResponse.data;
                        if (studentInfo.status && studentInfo.data) {
                            setScanHistory((prev) => [
                                {
                                    id: studentInfo.data.id,
                                    name: studentInfo.data.name,
                                    class: studentInfo.data.class,
                                    date: new Date().toLocaleString(),
                                    studentId: String(sid),
                                },
                                ...prev,
                            ].slice(0, 10));
                        }
                    } catch (_) {}
                }}
            />

            {/* История */}
            <div className="scan-history">
                <div className="scan-history-header">
                    <h3>История сканирований</h3>
                    {scanHistory.length > 0 && (
                        <button type="button" onClick={clearHistory} className="clear-history-btn">
                            Очистить
                        </button>
                    )}
                </div>
                {scanHistory.length === 0 ? (
                    <div className="empty-history">История пуста</div>
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
                .scan-attendance-container { max-width: 520px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px; }
                .scan-attendance-container h2 { margin: 0 0 24px 0; color: #1a1a1a; text-align: center; font-size: 1.35rem; }
                .scan-step { margin-bottom: 24px; }
                .step-label { margin: 0 0 12px 0; font-size: 14px; color: #6b7280; font-weight: 500; }
                .scan-back { margin-bottom: 16px; padding: 8px 0; border: none; background: none; color: #6366f1; font-size: 14px; cursor: pointer; }
                .scan-back:hover { text-decoration: underline; }
                .period-fields { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
                .period-fields label { display: flex; flex-direction: column; gap: 6px; }
                .period-fields label span { font-size: 13px; color: #374151; }
                .period-fields select { padding: 10px 14px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 15px; min-width: 120px; }
                .scan-btn-primary { width: 100%; padding: 12px 20px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; }
                .scan-btn-primary:hover:not(:disabled) { background: #4f46e5; }
                .scan-btn-primary:disabled { background: #a5b4fc; cursor: wait; }
                .scan-days-list { display: flex; flex-direction: column; gap: 10px; }
                .scan-day-card { display: block; width: 100%; padding: 14px 16px; text-align: left; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; font-size: 15px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
                .scan-day-card:hover { border-color: #6366f1; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15); }
                .scan-empty { padding: 20px; text-align: center; color: #6b7280; background: #fff; border-radius: 10px; border: 1px dashed #e5e7eb; }
                .scan-selected-day { margin-bottom: 20px; padding: 12px 16px; background: #eef2ff; border-radius: 8px; font-size: 15px; color: #3730a3; }
                .scan-form-wrapper .form-group { margin-bottom: 12px; }
                .scan-form-wrapper label { display: block; margin-bottom: 6px; font-weight: 500; color: #374151; font-size: 14px; }
                .scan-form-wrapper input { width: 100%; padding: 12px 14px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
                .scan-submit-btn { width: 100%; padding: 12px 20px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-size: 16px; font-weight: 500; cursor: pointer; margin-top: 8px; }
                .scan-submit-btn:hover:not(:disabled) { background: #4f46e5; }
                .scan-submit-btn:disabled { background: #a5b4fc; cursor: not-allowed; }
                .scan-camera-btn { width: 100%; padding: 12px 20px; margin-top: 10px; border: 1px solid #6366f1; border-radius: 8px; background: #fff; color: #6366f1; font-size: 15px; font-weight: 500; cursor: pointer; }
                .scan-camera-btn:hover:not(:disabled) { background: #eef2ff; }
                .scan-camera-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .notification { padding: 12px; margin: 12px 0; border-radius: 8px; text-align: center; font-weight: 500; }
                .notification.success { background: #d1fae5; color: #065f46; }
                .notification.error { background: #fee2e2; color: #b91c1c; }
                .scan-history { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                .scan-history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .scan-history-header h3 { margin: 0; font-size: 1rem; color: #374151; }
                .clear-history-btn { padding: 6px 12px; border: none; border-radius: 6px; background: #fecaca; color: #b91c1c; font-size: 13px; cursor: pointer; }
                .clear-history-btn:hover { background: #fca5a5; }
                .empty-history { text-align: center; color: #6b7280; padding: 16px; background: #f3f4f6; border-radius: 8px; font-size: 14px; }
                .history-list { list-style: none; padding: 0; margin: 0; }
                .history-item { background: #fff; padding: 12px 14px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e5e7eb; }
                .student-info { display: flex; justify-content: space-between; margin-bottom: 4px; }
                .student-name { font-weight: 600; }
                .student-class { color: #6b7280; font-size: 14px; }
                .scan-details { display: flex; justify-content: space-between; font-size: 13px; color: #9ca3af; }
            `}</style>
        </div>
    );
}
