import React, { useState, useEffect } from 'react';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
import { toast } from 'react-toastify';
import './OVTable.css';

const OVTable = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Фильтры
  const [filterType, setFilterType] = useState('all'); // 'all', 'ОВ', 'ДЗНВ'
  const [searchStudent, setSearchStudent] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/get-ov-homework-table`);
      
      if (response.data.status) {
        setData(response.data);
        setHomeworks(response.data.homeworks || []);
        setStudents(response.data.students || []);
      } else {
        toast.error('Ошибка загрузки данных');
      }
    } catch (error) {
      console.error('Error fetching OV table:', error);
      toast.error('Ошибка при загрузке таблицы');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация домашних заданий
  const filteredHomeworks = homeworks.filter(hw => {
    // Фильтр по типу
    if (filterType !== 'all' && hw.type !== filterType) {
      return false;
    }
    
    // Фильтр по датам
    if (hw.deadline) {
      const deadline = new Date(hw.deadline);
      
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (deadline < from) return false;
      }
      
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (deadline > to) return false;
      }
    }
    
    return true;
  });

  // Фильтрация студентов
  const filteredStudents = students.filter(student => {
    if (!searchStudent) return true;
    const search = searchStudent.toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(search) ||
      student.class?.toString().includes(search) ||
      student.group_name?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="ov-table-container">
        <div className="ov-table-loading">
          <div className="spinner"></div>
          <p>Загрузка таблицы...</p>
        </div>
      </div>
    );
  }

  if (!data || homeworks.length === 0) {
    return (
      <div className="ov-table-container">
        <div className="ov-table-empty">
          <div className="empty-icon">📋</div>
          <h2>Нет домашних заданий</h2>
          <p>Домашние задания еще не созданы</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="ov-table-container">
        <div className="ov-table-empty">
          <div className="empty-icon">👥</div>
          <h2>Нет студентов</h2>
          <p>В системе нет студентов</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ov-table-container">
      <div className="ov-table-header">
        <h1>📋 Таблица домашних заданий (ОВ и ДЗНВ)</h1>
        <p className="ov-table-subtitle">
          Всего заданий: {filteredHomeworks.length} из {homeworks.length} | Студентов: {filteredStudents.length} из {students.length}
        </p>
      </div>

      {/* Панель фильтров */}
      <div className="ov-table-filters">
        <div className="filter-group">
          <label className="filter-label">Тип задания:</label>
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Все</option>
            <option value="ОВ">ОВ</option>
            <option value="ДЗНВ">ДЗНВ</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Дата от:</label>
          <input
            type="date"
            className="filter-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Дата до:</label>
          <input
            type="date"
            className="filter-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="filter-group filter-search">
          <label className="filter-label">Поиск студента:</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Имя, класс, группа..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
          />
        </div>

        {(filterType !== 'all' || dateFrom || dateTo || searchStudent) && (
          <button
            className="filter-clear-btn"
            onClick={() => {
              setFilterType('all');
              setDateFrom('');
              setDateTo('');
              setSearchStudent('');
            }}
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {filteredHomeworks.length === 0 && (
        <div className="ov-table-empty-state">
          <p>Нет домашних заданий по выбранным фильтрам</p>
        </div>
      )}

      {filteredStudents.length === 0 && homeworks.length > 0 && (
        <div className="ov-table-empty-state">
          <p>Нет студентов по выбранным фильтрам</p>
        </div>
      )}

      {filteredHomeworks.length > 0 && filteredStudents.length > 0 && (
      <div className="ov-table-wrapper">
        <div className="ov-table-scroll">
          <table className="ov-table excel-style">
            <thead>
              <tr>
                <th className="student-col">Студент</th>
                <th className="class-col">Класс</th>
                <th className="group-col">Группа</th>
                {filteredHomeworks.map((hw) => (
                  <th key={hw.id} className="homework-col" title={hw.name}>
                    <div className="homework-header">
                      <div className="homework-type-badge" data-type={hw.type}>
                        {hw.type}
                      </div>
                      <div className="homework-name">{hw.name}</div>
                      <div className="homework-deadline">
                        {hw.deadline ? new Date(hw.deadline).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '-'}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="student-col">{student.full_name}</td>
                  <td className="class-col">{student.class || '-'}</td>
                  <td className="group-col">{student.group_name || '-'}</td>
                  {filteredHomeworks.map((hw) => {
                    const result = student.results?.find(r => r.homework_id === hw.id);
                    const isSubmitted = result?.status === 1;
                    const statusText = result?.status_text || 'Не начато';
                    const score = result?.result;
                    
                    return (
                      <td
                        key={hw.id}
                        className={`cell ${isSubmitted ? 'cell-success' : 'cell-failed'}`}
                        title={`${statusText}${score !== null && score !== undefined ? ` - ${score}` : ''}`}
                      >
                        <div className="cell-content">
                          {isSubmitted ? (
                            <>
                              <span className="cell-check">✓</span>
                              {score !== null && score !== undefined && (
                                <span className="cell-score">{score}</span>
                              )}
                            </>
                          ) : (
                            <span className="cell-cross">✗</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <div className="ov-table-legend">
        <div className="legend-item">
          <div className="legend-color cell-success"></div>
          <span>Сдано</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cell-failed"></div>
          <span>Не сдано / Просрочено</span>
        </div>
      </div>
    </div>
  );
};

export default OVTable;

