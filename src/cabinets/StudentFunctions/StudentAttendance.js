import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentAttendance.css';
import { API_EXAM_URL } from '../../Config';
export default function StudentAttendance() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAttendance();
    }, [year, month]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const studentId = localStorage.getItem('id');
            if (!studentId) {
                throw new Error('ID студента не найден в localStorage');
            }

            const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
            
            const response = await axios.post(`${API_EXAM_URL}/get-attendance`, {
                student_id: studentId,
                year_month: yearMonth
            });

            if (response.data.status) {
                setAttendanceData(response.data.attendance);
            } else {
                throw new Error('Ошибка загрузки данных о посещаемости');
            }
        } catch (err) {
            setError(err.message);
            console.error('Ошибка при загрузке посещаемости:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (e) => {
        setYear(parseInt(e.target.value));
    };

    const handleMonthChange = (e) => {
        setMonth(parseInt(e.target.value));
    };

    const months = [
        { value: 1, label: 'Январь' },
        { value: 2, label: 'Февраль' },
        { value: 3, label: 'Март' },
        { value: 4, label: 'Апрель' },
        { value: 5, label: 'Май' },
        { value: 6, label: 'Июнь' },
        { value: 7, label: 'Июль' },
        { value: 8, label: 'Август' },
        { value: 9, label: 'Сентябрь' },
        { value: 10, label: 'Октябрь' },
        { value: 11, label: 'Ноябрь' },
        { value: 12, label: 'Декабрь' }
    ];

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    // Создаем Map для быстрого доступа к данным посещаемости
    const attendanceMap = new Map();
    attendanceData.forEach(day => {
        const dateObj = new Date(day.date);
        const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        attendanceMap.set(dateKey, day);
    });

    // Формируем полный календарь месяца
    const groupedDays = [];
    const daysInMonth = new Date(year, month, 0).getDate(); // Количество дней в месяце
    let currentWeek = Array(7).fill(null);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        let dayOfWeek = dateObj.getDay() - 1;
        if (dayOfWeek === -1) dayOfWeek = 6;
        
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const attendanceDay = attendanceMap.get(dateKey);
        
        currentWeek[dayOfWeek] = attendanceDay || {
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            attendance_rate: null
        };
        
        if (dayOfWeek === 6 || day === daysInMonth) {
            groupedDays.push([...currentWeek]);
            if (day !== daysInMonth) {
                currentWeek = Array(7).fill(null);
            }
        }
    }

    return (
        <div className="attendance-container">
            <div className="controls">
                <div className="input-group">
                    <label htmlFor="year-select">Год:</label>
                    <select 
                        id="year-select"
                        value={year} 
                        onChange={handleYearChange} 
                        className="year-select"
                    >
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                
                <div className="input-group">
                    <label htmlFor="month-select">Месяц:</label>
                    <select 
                        id="month-select"
                        value={month} 
                        onChange={handleMonthChange} 
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

            <div className="calendar">
                <div className="week-header">
                    {weekdays.map(day => (
                        <div key={day} className="day-header">
                            {day}
                        </div>
                    ))}
                </div>

                {groupedDays.map((week, weekIndex) => (
                    <div key={weekIndex} className="week">
                        {week.map((day, dayIndex) => {
                            if (!day) {
                                return <div key={`empty-${weekIndex}-${dayIndex}`} className="day empty"></div>;
                            }
                            
                            const isSunday = new Date(day.date).getDay() === 0;
                            const rate = day.attendance_rate;
                            let dayClass = 'absent';
                            let titleText = 'Отсутствовал';
                            
                            if (!isSunday && rate !== null && rate !== undefined) {
                                if (rate === 2) {
                                    dayClass = 'valid';
                                    titleText = 'Уважительная причина';
                                } else if (rate === 1) {
                                    dayClass = 'present';
                                    titleText = 'Присутствовал';
                                }
                            } else if (isSunday) {
                                dayClass = 'sunday';
                                titleText = 'Воскресенье';
                            }
                            
                            return (
                                <div 
                                    key={day.date} 
                                    className={`day ${dayClass}`}
                                    title={titleText}
                                >
                                    {new Date(day.date).getDate()}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}