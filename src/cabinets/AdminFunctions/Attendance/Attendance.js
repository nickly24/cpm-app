import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../Config";
const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export default function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/get-attendance-by-month`, {
        month: month,
        year: year,
      });
      if (response.data.status) {
        setData(response.data.res);
      } else {
        alert("Ошибка при загрузке данных посещаемости");
      }
    } catch (error) {
      alert("Ошибка при запросе к серверу");
    }
    setLoading(false);
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/add-attendance`, {
        studentId: parseInt(studentId),
        date: date,
      });
      alert("Посещение успешно добавлено");
      fetchData(); // обновляем данные после добавления
    } catch (error) {
      alert("Ошибка при добавлении посещения");
    }
  };

  return (
    <div className="attendance-container">
      <h2>Посещаемость</h2>
      <div className="date-picker">
        <input
          type="number"
          min="2020"
          max="2100"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {monthNames.map((name, index) => (
            <option key={index + 1} value={index + 1}>{name}</option>
          ))}
        </select>
      </div>

      <form className="add-form" onSubmit={handleAddAttendance}>
        <input
          type="number"
          placeholder="ID студента"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button className="btn_1" type="submit">Добавить посещение</button>
      </form>

      {loading && <p>Загрузка...</p>}

      {!loading && data && (
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Имя студента</th>
                {data.days.map((day) => (
                  <th key={day.day}>
                    {day.day}
                    <br />
                    {day.weekday}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.full_name}</td>
                  {student.attendance.map((mark, index) => (
                    <td key={index} className={
                      mark === "✓" ? "valid" : 
                      mark === "+" ? "present" : 
                      mark === "-" ? "absent" : 
                      "weekend"
                    }>
                      {mark === "" ? "" : mark === "✓" ? "✓" : mark}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .attendance-container {
          max-width: 90%;
          margin: 30px auto;
          font-family: Arial, sans-serif;
        }

        .date-picker {
          margin-bottom: 20px;
        }

        input[type="number"], select, input[type="date"] {
          margin-right: 10px;
          padding: 5px;
          border-radius: 5px;
          border: 1px solid #ccc;
          width: auto;
        }

        .add-form {
          margin-bottom: 20px;
        }


.btn_1 {
          padding: 5px 15px;
          border: none;
          border-radius: 5px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
        }

        button:hover {
          background-color: #0056b3;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
        }

        .attendance-table th,
        .attendance-table td {
          border: 1px solid #ddd;
          padding: 8px;
          min-width: 40px;
        }

        .attendance-table th {
          background-color: #f4f4f4;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .present {
          background-color: #d4edda;
          color: #155724;
          font-weight: bold;
        }

        .absent {
          background-color: #f8d7da;
          color: #721c24;
          font-weight: bold;
        }

        .valid {
          background-color: #fff3cd;
          color: #856404;
          font-weight: bold;
        }

        .weekend {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
}