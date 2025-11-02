import React, { useState, useEffect } from 'react';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
const StudentList = ({ groupId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true; // Флаг для избежания утечек памяти

    const fetchStudents = async () => {
      try {
        if (!groupId) {
          throw new Error('ID группы не указан');
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/student-group-filter`,
          { id: groupId },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000 // Таймаут 5 секунд
          }
        );

        if (isMounted) {
          if (response.data?.status && Array.isArray(response.data?.res)) {
            setStudents(response.data.res);
          } else {
            throw new Error('Неверный формат данных от сервера');
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Ошибка при загрузке данных');
          console.error('Ошибка:', err);
          setStudents([]); // Сбрасываем список студентов при ошибке
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false; // Очистка при размонтировании
    };
  }, [groupId]);

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Функция для повторной загрузки
  const retryFetch = () => {
    setLoading(true);
    setError(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка списка студентов...</p>
        <button onClick={retryFetch} className="retry-btn">
          Повторить попытку
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={retryFetch} className="retry-btn">
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="student-list">
      <div className="controls">
        <h3>Ваши ученики</h3>
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={students.length === 0}
        />
        <span className="counter">
          Найдено: {filteredStudents.length} из {students.length}
        </span>
      </div>

      {filteredStudents.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ФИО</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.full_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">
          {students.length === 0
            ? 'В этой группе нет студентов'
            : 'Студенты по вашему запросу не найдены'}
        </div>
      )}
    </div>
  );
};

export default StudentList;