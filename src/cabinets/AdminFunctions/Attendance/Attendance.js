import React, { useEffect, useState } from "react";
import axios from "../../../api";
import { API_BASE_URL } from "../../../Config";

const MONTH_NAMES = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];
const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

function formatDayLabel(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const wd = WEEKDAYS[date.getDay()];
  return `${day} ${month}, ${wd}`;
}

function CreateDayModal({ onClose, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [comment, setComment] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/class-days`, {
        date,
        comment: comment || undefined,
      });
      if (res.data.status) {
        setComment("");
        onSuccess(res.data.id);
        onClose();
      } else setError(res.data.error || "Ошибка создания");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка при создании дня");
    }
    setCreating(false);
  };

  return (
    <div className="attendance-modal-overlay" onClick={onClose}>
      <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="attendance-modal-header">
          <h3>Создать день занятий</h3>
          <button type="button" className="attendance-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="attendance-modal-body">
          <div className="form-row">
            <label>Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Комментарий (необязательно)</label>
            <input
              type="text"
              placeholder="Например: тема занятия"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="attendance-modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Отмена</button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Создание…" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [classDays, setClassDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [dayAttendance, setDayAttendance] = useState(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [addStudentId, setAddStudentId] = useState("");
  const [addTypeId, setAddTypeId] = useState(1);
  const [types, setTypes] = useState([]);
  const [adding, setAdding] = useState(false);

  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  useEffect(() => {
    fetchClassDays();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchTypes();
  }, []);

  useEffect(() => {
    if (selectedDayId) fetchDayAttendance(selectedDayId);
    else setDayAttendance(null);
  }, [selectedDayId]);

  const fetchTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance-types`);
      if (res.data.status && res.data.types) setTypes(res.data.types);
    } catch (_) {}
  };

  const fetchClassDays = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/class-days`, {
        params: { date_from: dateFrom, date_to: dateTo },
      });
      if (res.data.status && res.data.class_days) {
        setClassDays(res.data.class_days);
      } else setClassDays([]);
    } catch (_) {
      setClassDays([]);
    }
    setLoading(false);
  };

  const fetchDayAttendance = async (classDayId) => {
    setLoadingDay(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/class-days/${classDayId}/attendance`);
      setDayAttendance(res.data.status ? res.data.attendance : []);
    } catch (_) {
      setDayAttendance([]);
    }
    setLoadingDay(false);
  };

  const handleCreateSuccess = (newDayId) => {
    fetchClassDays();
    setSelectedDayId(newDayId);
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    if (!selectedDayId || !addStudentId.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/class-days/${selectedDayId}/attendance`,
        { student_id: parseInt(addStudentId, 10), attendance_type_id: addTypeId }
      );
      if (res.data.status) {
        setAddStudentId("");
        fetchDayAttendance(selectedDayId);
      } else alert(res.data.error || "Ошибка добавления");
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка при добавлении");
    }
    setAdding(false);
  };

  const selectedDay = classDays.find((d) => d.id === selectedDayId);

  return (
    <div className="admin-attendance">
      <header className="admin-attendance-header">
        <h2>Посещаемость</h2>
        <div className="admin-attendance-toolbar">
          <div className="period-controls">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="period-select"
            >
              {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 3 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="period-select"
            >
              {[
                "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
              ].map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-create-day"
            onClick={() => setShowCreateModal(true)}
          >
            + Создать день занятий
          </button>
        </div>
      </header>

      {showCreateModal && (
        <CreateDayModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      <div className="admin-attendance-main">
        {selectedDayId == null ? (
          <div className="days-list-view">
            {loading && <div className="loading-state">Загрузка…</div>}
            {!loading && classDays.length === 0 && (
              <div className="empty-state">
                <p>За выбранный период нет дней занятий.</p>
                <p>Нажмите «Создать день занятий», чтобы добавить первый.</p>
              </div>
            )}
            {!loading && classDays.length > 0 && (
              <div className="days-grid">
                {classDays.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    className="day-card"
                    onClick={() => setSelectedDayId(d.id)}
                  >
                    <span className="day-card-date">{formatDayLabel(d.date)}</span>
                    {d.comment && <span className="day-card-comment">{d.comment}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="day-detail-view">
            <button
              type="button"
              className="back-to-list"
              onClick={() => setSelectedDayId(null)}
            >
              ← К списку дней
            </button>
            {selectedDay && (
              <>
                <h3 className="day-detail-title">{formatDayLabel(selectedDay.date)}</h3>
                {selectedDay.comment && (
                  <p className="day-detail-comment">{selectedDay.comment}</p>
                )}

                <div className="add-attendance-block">
                  <h4>Добавить посещение</h4>
                  <form className="add-attendance-form" onSubmit={handleAddAttendance}>
                    <input
                      type="number"
                      placeholder="ID студента"
                      value={addStudentId}
                      onChange={(e) => setAddStudentId(e.target.value)}
                      className="add-input"
                    />
                    <select
                      value={addTypeId}
                      onChange={(e) => setAddTypeId(Number(e.target.value))}
                      className="add-select"
                    >
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name_ru}</option>
                      ))}
                    </select>
                    <button type="submit" className="btn-add" disabled={adding}>
                      {adding ? "…" : "Добавить"}
                    </button>
                  </form>
                </div>

                <div className="attendance-table-block">
                  <h4>Список посещаемости</h4>
                  {loadingDay && <div className="loading-state">Загрузка…</div>}
                  {!loadingDay && dayAttendance && (
                    dayAttendance.length === 0 ? (
                      <p className="no-attendance">В этот день пока никого нет.</p>
                    ) : (
                      <div className="table-wrap">
                        <table className="attendance-table">
                          <thead>
                            <tr>
                              <th>Студент</th>
                              <th>Тип посещения</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayAttendance.map((a) => (
                              <tr key={a.id}>
                                <td>{a.full_name} <span className="student-id">(ID: {a.student_id})</span></td>
                                <td>{a.type_name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        .admin-attendance { max-width: 960px; margin: 0 auto; padding: 24px 20px; font-family: system-ui, -apple-system, sans-serif; }
        .admin-attendance-header { margin-bottom: 24px; }
        .admin-attendance-header h2 { margin: 0 0 16px 0; font-size: 1.5rem; font-weight: 600; color: #1a1a1a; }
        .admin-attendance-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
        .period-controls { display: flex; gap: 8px; }
        .period-select { padding: 10px 14px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 15px; background: #fff; }
        .btn-create-day { padding: 10px 18px; border-radius: 8px; border: none; background: #6366f1; color: #fff; font-size: 15px; font-weight: 500; cursor: pointer; }
        .btn-create-day:hover { background: #4f46e5; }

        .admin-attendance-main { min-height: 320px; }

        .days-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .day-card { display: block; width: 100%; padding: 18px 16px; text-align: left; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
        .day-card:hover { border-color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15); }
        .day-card-date { display: block; font-weight: 600; font-size: 15px; color: #1a1a1a; margin-bottom: 4px; }
        .day-card-comment { display: block; font-size: 13px; color: #6b7280; }

        .loading-state, .no-attendance { color: #6b7280; padding: 24px; text-align: center; }
        .empty-state { text-align: center; padding: 48px 24px; background: #f9fafb; border-radius: 12px; color: #6b7280; }
        .empty-state p { margin: 0 0 8px 0; }
        .empty-state p:last-child { margin-bottom: 0; }

        .day-detail-view { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; }
        .back-to-list { margin-bottom: 20px; padding: 8px 0; border: none; background: none; color: #6366f1; font-size: 14px; cursor: pointer; }
        .back-to-list:hover { text-decoration: underline; }
        .day-detail-title { margin: 0 0 8px 0; font-size: 1.25rem; font-weight: 600; color: #1a1a1a; }
        .day-detail-comment { margin: 0 0 24px 0; font-size: 14px; color: #6b7280; }
        .add-attendance-block { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #eee; }
        .add-attendance-block h4, .attendance-table-block h4 { margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 600; color: #374151; }
        .add-attendance-form { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .add-input, .add-select { padding: 10px 12px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 14px; }
        .add-input { width: 120px; }
        .add-select { min-width: 220px; }
        .btn-add { padding: 10px 20px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-weight: 500; cursor: pointer; }
        .btn-add:hover:not(:disabled) { background: #4f46e5; }
        .btn-add:disabled { background: #a5b4fc; cursor: not-allowed; }
        .table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
        .attendance-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .attendance-table th, .attendance-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
        .attendance-table th { background: #f9fafb; font-weight: 600; color: #374151; }
        .attendance-table tr:last-child td { border-bottom: none; }
        .student-id { color: #6b7280; font-size: 13px; }

        .attendance-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .attendance-modal { background: #fff; border-radius: 16px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .attendance-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 0; }
        .attendance-modal-header h3 { margin: 0; font-size: 1.2rem; font-weight: 600; }
        .attendance-modal-close { width: 36px; height: 36px; border: none; background: #f3f4f6; border-radius: 8px; font-size: 22px; line-height: 1; cursor: pointer; color: #6b7280; }
        .attendance-modal-close:hover { background: #e5e7eb; color: #1a1a1a; }
        .attendance-modal-body { padding: 20px 20px 24px; }
        .form-row { margin-bottom: 16px; }
        .form-row label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: #374151; }
        .form-row input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e0e0e0; font-size: 15px; box-sizing: border-box; }
        .form-error { margin-bottom: 12px; padding: 10px 12px; background: #fef2f2; color: #b91c1c; border-radius: 8px; font-size: 14px; }
        .attendance-modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; }
        .btn-secondary { padding: 10px 18px; border-radius: 8px; border: 1px solid #e0e0e0; background: #fff; color: #374151; cursor: pointer; font-size: 14px; }
        .btn-secondary:hover { background: #f9fafb; }
        .btn-primary { padding: 10px 18px; border-radius: 8px; border: none; background: #6366f1; color: #fff; font-weight: 500; cursor: pointer; font-size: 14px; }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; }
        .btn-primary:disabled { background: #a5b4fc; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
