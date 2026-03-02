import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
import './StudentSchedule.css';

const daysOrder = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
];

const dayShort = {
  Понедельник: 'Пн',
  Вторник: 'Вт',
  Среда: 'Ср',
  Четверг: 'Чт',
  Пятница: 'Пт',
  Суббота: 'Сб',
  Воскресенье: 'Вс'
};

const dayAccentMap = {
  Понедельник: { accent: '#4f8cff', soft: '#eef4ff' },
  Вторник: { accent: '#22a06b', soft: '#eaf8f1' },
  Среда: { accent: '#0ea5e9', soft: '#e8f6fc' },
  Четверг: { accent: '#f59e0b', soft: '#fff7e7' },
  Пятница: { accent: '#8b5cf6', soft: '#f3eeff' },
  Суббота: { accent: '#ef4444', soft: '#fdeeee' },
  Воскресенье: { accent: '#64748b', soft: '#f1f5f9' }
};

const toMinutes = (timeStr) => {
  if (!timeStr || !String(timeStr).includes(':')) return null;
  const [h, m] = String(timeStr).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const fromMinutes = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getTodayDayName = () => {
  const raw = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(new Date());
  const normalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return daysOrder.includes(normalized) ? normalized : 'Понедельник';
};

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(getTodayDayName());

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/schedule`);
      if (response.data.status) {
        setSchedule(response.data.schedule || []);
      } else {
        setError(response.data.error || 'Ошибка при загрузке расписания');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ошибка сервера');
      console.error('Schedule error:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupedSchedule = useMemo(() => {
    const grouped = {};
    schedule.forEach((lesson) => {
      const day = lesson.day_of_week;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(lesson);
    });
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    });
    return grouped;
  }, [schedule]);

  const { startMinute, endMinute, hourMarks, totalMinutes } = useMemo(() => {
    const allStarts = schedule.map((l) => toMinutes(l.start_time)).filter((n) => n != null);
    const allEnds = schedule.map((l) => toMinutes(l.end_time)).filter((n) => n != null);

    if (!allStarts.length || !allEnds.length) {
      const fallbackStart = 8 * 60;
      const fallbackEnd = 18 * 60;
      const marks = [];
      for (let m = fallbackStart; m <= fallbackEnd; m += 60) marks.push(m);
      return {
        startMinute: fallbackStart,
        endMinute: fallbackEnd,
        hourMarks: marks,
        totalMinutes: fallbackEnd - fallbackStart
      };
    }

    const minStart = Math.min(...allStarts);
    const maxEnd = Math.max(...allEnds);
    const paddedStart = Math.max(0, Math.floor((minStart - 30) / 60) * 60);
    const paddedEnd = Math.min(24 * 60, Math.ceil((maxEnd + 30) / 60) * 60);
    const marks = [];
    for (let m = paddedStart; m <= paddedEnd; m += 60) marks.push(m);
    return {
      startMinute: paddedStart,
      endMinute: paddedEnd,
      hourMarks: marks,
      totalMinutes: Math.max(60, paddedEnd - paddedStart)
    };
  }, [schedule]);

  const renderDayColumnBody = (day) => {
    const lessons = groupedSchedule[day] || [];
    const palette = dayAccentMap[day] || { accent: '#4f8cff', soft: '#eef4ff' };
    return (
      <div className="ss-grid-col-body">
        {hourMarks.map((mark) => {
          const top = ((mark - startMinute) / totalMinutes) * 100;
          return (
            <div key={`${day}-${mark}`} className="ss-grid-line" style={{ top: `${top}%` }} />
          );
        })}

        {lessons.map((lesson) => {
          const start = toMinutes(lesson.start_time);
          const end = toMinutes(lesson.end_time);
          if (start == null || end == null || end <= start) return null;
          const duration = end - start;
          const isCompact = duration < 75;
          const top = ((start - startMinute) / totalMinutes) * 100;
          const height = Math.max(8, ((end - start) / totalMinutes) * 100);
          return (
            <article
              key={lesson._id}
              className="ss-event"
              style={{
                top: `${top}%`,
                height: `${height}%`,
                '--event-accent': palette.accent,
                '--event-soft': palette.soft
              }}
              title={`${lesson.lesson_name} (${lesson.start_time}-${lesson.end_time})`}
            >
              <div className="ss-event-time">{lesson.start_time} - {lesson.end_time}</div>
              <div className="ss-event-title">{lesson.lesson_name}</div>
              {!isCompact && <div className="ss-event-meta">{lesson.teacher_name}</div>}
              {!isCompact && <div className="ss-event-meta">{lesson.location}</div>}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="ss-week-wrap">
      <div className="ss-week-head">
        <div>
          <h2 className="ss-week-title">Расписание</h2>
          <p className="ss-week-subtitle">Календарная сетка по дням недели и времени</p>
        </div>
        <button className="ss-week-refresh" onClick={fetchSchedule} disabled={loading}>
          Обновить
        </button>
      </div>

      {error && <div className="ss-week-error">⚠ {error}</div>}

      {loading ? (
        <div className="ss-week-loading">
          <div className="ss-week-spinner" />
          <p>Загрузка расписания...</p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet week grid */}
          <section className="ss-week-desktop">
            <div className="ss-grid-scroll">
              <div className="ss-grid">
                <div className="ss-grid-time-head" />

                {daysOrder.map((day) => (
                  <div key={`head-${day}`} className={`ss-grid-day-head ${day === getTodayDayName() ? 'today' : ''}`}>
                    <span className="ss-grid-day-short">{dayShort[day]}</span>
                    <span className="ss-grid-day-full">{day}</span>
                  </div>
                ))}

                <div className="ss-grid-time-col">
                  {hourMarks.map((mark) => {
                    const top = ((mark - startMinute) / totalMinutes) * 100;
                    return (
                      <span key={`time-${mark}`} className="ss-grid-time-label" style={{ top: `${top}%` }}>
                        {fromMinutes(mark)}
                      </span>
                    );
                  })}
                </div>

                {daysOrder.map((day) => (
                  <div key={`col-${day}`} className="ss-grid-col">
                    {renderDayColumnBody(day)}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mobile: one-day timeline with day tabs */}
          <section className="ss-week-mobile">
            <div className="ss-mobile-tabs">
              {daysOrder.map((day) => (
                <button
                  key={`mobile-${day}`}
                  className={`ss-mobile-tab ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span>{dayShort[day]}</span>
                  <small>{(groupedSchedule[day] || []).length}</small>
                </button>
              ))}
            </div>

            <div className="ss-mobile-day-title">{selectedDay}</div>

            <div className="ss-mobile-list">
              {(groupedSchedule[selectedDay] || []).length === 0 ? (
                <div className="ss-empty"><p>Сегодня занятий нет</p></div>
              ) : (
                (groupedSchedule[selectedDay] || []).map((lesson) => {
                  const palette = dayAccentMap[selectedDay] || { accent: '#4f8cff', soft: '#eef4ff' };
                  return (
                    <article
                      key={`m-${lesson._id}`}
                      className="ss-mobile-lesson"
                      style={{ '--event-accent': palette.accent, '--event-soft': palette.soft }}
                    >
                      <div className="ss-mobile-lesson-time">{lesson.start_time} - {lesson.end_time}</div>
                      <h4 className="ss-mobile-lesson-title">{lesson.lesson_name}</h4>
                      <p className="ss-mobile-lesson-meta">{lesson.teacher_name}</p>
                      <p className="ss-mobile-lesson-meta">{lesson.location}</p>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default StudentSchedule;
