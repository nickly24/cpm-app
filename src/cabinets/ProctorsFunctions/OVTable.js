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
          <h2>Нет домашних заданий типа ОВ</h2>
          <p>Домашние задания типа ОВ еще не созданы</p>
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
        <h1>📋 Таблица обязательных работ (ОВ)</h1>
        <p className="ov-table-subtitle">
          Всего заданий: {homeworks.length} | Всего студентов: {students.length}
        </p>
      </div>

      <div className="ov-table-wrapper">
        <div className="ov-table-scroll">
          <table className="ov-table excel-style">
            <thead>
              <tr>
                <th className="student-col">Студент</th>
                <th className="class-col">Класс</th>
                <th className="group-col">Группа</th>
                {homeworks.map((hw) => (
                  <th key={hw.id} className="homework-col" title={hw.name}>
                    <div className="homework-header">
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
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="student-col">{student.full_name}</td>
                  <td className="class-col">{student.class || '-'}</td>
                  <td className="group-col">{student.group_name || '-'}</td>
                  {homeworks.map((hw) => {
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

