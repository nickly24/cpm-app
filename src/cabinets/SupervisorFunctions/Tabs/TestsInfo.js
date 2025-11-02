import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import './TestsInfo.css';
import { API_EXAM_URL } from '../../../Config';
const TestsInfo = ({ studentId }) => {
  const [testsData, setTestsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestsData = async () => {
      try {
        const response = await axios.post(`${API_EXAM_URL}/get-tests-w-results-student`, {
          student_id: studentId
        });
        setTestsData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTestsData();
  }, [studentId]);

  if (loading) return <div className="loading">Загрузка данных...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (!testsData) return <div className="no-data">Нет данных о тестах</div>;

  return (
    <div className="tests-info-container">
      <h2>Результаты тестов для студента #{studentId}</h2>
      
      {Object.entries(testsData).map(([branchId, branchData]) => (
        <div key={branchId} className="branch-section">
          <h3 className="branch-title">{branchData.branch_name}</h3>
          
          <div className="tests-grid">
            {branchData.tests.map((test) => (
              <div key={test.session_id} className="test-card">
                <div className="test-header">
                  <span className="test-name">{test.test_name}</span>
                  <span className={`test-score ${test.result >= 80 ? 'high' : test.result >= 50 ? 'medium' : 'low'}`}>
                    {test.result}%
                  </span>
                </div>
                <div className="test-details">
                  <span className="test-date">{new Date(test.date).toLocaleDateString()}</span>
                  <span className="test-id">ID теста: {test.test_id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TestsInfo;