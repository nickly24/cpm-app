import React, { useState, useEffect } from 'react';
import axios from '../../api';
import './StudentAttendance.css';
import { API_BASE_URL } from '../../Config';
import { useAuth } from '../../AuthContext';

// Форматирование даты для карточки: "14 февраля" + день недели отдельно
const MONTH_NAMES = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function formatCardDate(dateStr) {
    if (!dateStr) return { dayMonth: '', weekday: '' };
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    const weekday = WEEKDAYS[d.getDay()];
    return { dayMonth: `${day} ${month}`, weekday };
}

// Модальное окно с деталями отгула (только просмотр для студента)
function ZapDetailModal({ zapId, onClose }) {
    const [zap, setZap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!zapId) return;
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axios.get(`${API_BASE_URL}/api/get-zap/${zapId}`);
                if (!cancelled && res.data.status && res.data.zap) {
                    setZap(res.data);
                } else if (!cancelled) {
                    setError('Не удалось загрузить запрос');
                }
            } catch (err) {
                if (!cancelled) setError(err.response?.data?.error || 'Ошибка загрузки');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [zapId]);

    const getStatusLabel = (status) => {
        switch (status) {
            case 'set': return 'На рассмотрении';
            case 'apr': return 'Одобрено';
            case 'dec': return 'Отклонено';
            default: return status;
        }
    };

    return (
        <div className="attendance-zap-overlay" onClick={onClose}>
            <div className="attendance-zap-modal" onClick={e => e.stopPropagation()}>
                <div className="attendance-zap-modal-header">
                    <h3>Запрос на отгул #{zapId}</h3>
                    <button type="button" className="attendance-zap-close" onClick={onClose}>×</button>
                </div>
                <div className="attendance-zap-modal-body">
                    {loading && <div className="loading">Загрузка...</div>}
                    {error && <div className="error">{error}</div>}
                    {zap && zap.zap && (
                        <>
                            <p className="attendance-zap-status">
                                <strong>Статус:</strong> {getStatusLabel(zap.zap.status)}
                            </p>
                            <div className="attendance-zap-text">
                                <strong>Текст запроса:</strong>
                                <div>{zap.zap.text}</div>
                            </div>
                            {zap.zap.answer && (
                                <div className="attendance-zap-answer">
                                    <strong>Ответ:</strong>
                                    <div>{zap.zap.answer}</div>
                                </div>
                            )}
                            {zap.images && zap.images.length > 0 && (
                                <div className="attendance-zap-images">
                                    <strong>Прикреплённые файлы:</strong>
                                    <div className="attendance-zap-images-grid">
                                        {zap.images.map((img, idx) => (
                                            img.img_base64 && (
                                                <div key={idx} className="attendance-zap-img-wrap">
                                                    {img.img_base64.includes('application/pdf') || (img.file_type && img.file_type.includes('pdf')) ? (
                                                        <div className="attendance-zap-pdf">PDF</div>
                                                    ) : (
                                                        <img src={img.img_base64} alt={`Файл ${idx + 1}`} />
                                                    )}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function StudentAttendance() {
    const { user } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [zapModalId, setZapModalId] = useState(null);

    const studentId = user?.id;

    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    useEffect(() => {
        if (!studentId) return;
        fetchAttendance();
    }, [studentId, year, month]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(
                `${API_BASE_URL}/api/students/${studentId}/class-day-attendance`,
                { params: { date_from: dateFrom, date_to: dateTo } }
            );
            if (res.data.status && Array.isArray(res.data.attendance)) {
                const sorted = [...res.data.attendance].sort(
                    (a, b) => new Date(a.date) - new Date(b.date)
                );
                setAttendance(sorted);
            } else {
                setAttendance([]);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Ошибка загрузки посещаемости');
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    const months = [
        { value: 1, label: 'Январь' }, { value: 2, label: 'Февраль' }, { value: 3, label: 'Март' },
        { value: 4, label: 'Апрель' }, { value: 5, label: 'Май' }, { value: 6, label: 'Июнь' },
        { value: 7, label: 'Июль' }, { value: 8, label: 'Август' }, { value: 9, label: 'Сентябрь' },
        { value: 10, label: 'Октябрь' }, { value: 11, label: 'Ноябрь' }, { value: 12, label: 'Декабрь' }
    ];

    return (
        <div className="attendance-container attendance-cards">
            <h2 className="attendance-title">Посещаемость</h2>

            <div className="controls">
                <div className="input-group">
                    <label htmlFor="year-select">Год</label>
                    <select
                        id="year-select"
                        value={year}
                        onChange={e => setYear(parseInt(e.target.value, 10))}
                        className="year-select"
                    >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <label htmlFor="month-select">Месяц</label>
                    <select
                        id="month-select"
                        value={month}
                        onChange={e => setMonth(parseInt(e.target.value, 10))}
                        className="month-select"
                    >
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && <div className="loading">Загрузка...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <>
                    {attendance.length === 0 ? (
                        <div className="attendance-empty">
                            За выбранный месяц нет записей о посещаемости.
                        </div>
                    ) : (
                        <div className="attendance-cards-grid">
                            {attendance.map((item) => (
                                <div key={`${item.class_day_id}-${item.date}`} className={`attendance-card card-type-${item.type_code || 'default'}`}>
                                    <div className="attendance-card-date">{formatCardDate(item.date).dayMonth}</div>
                                    <div className="attendance-card-weekday">{formatCardDate(item.date).weekday}</div>
                                    {item.comment && (
                                        <div className="attendance-card-comment">{item.comment}</div>
                                    )}
                                    <div className={`attendance-card-type type-${item.type_code}`}>
                                        {item.type_name}
                                    </div>
                                    {item.zap_id != null && (
                                        <button
                                            type="button"
                                            className="attendance-card-zap-link"
                                            onClick={() => setZapModalId(item.zap_id)}
                                        >
                                            Подробнее об отгуле #{item.zap_id}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {zapModalId != null && (
                <ZapDetailModal zapId={zapModalId} onClose={() => setZapModalId(null)} />
            )}
        </div>
    );
}
