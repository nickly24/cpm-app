import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExamsList.css';
import { API_EXAM_URL } from '../../Config';
const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' или 'details'

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get(`${API_EXAM_URL}/get-all-exams`);
        if (response.data.status && response.data.exams) {
          setExams(response.data.exams);
        } else {
          setError('Не удалось загрузить данные экзаменов');
        }
      } catch (err) {
        setError('Ошибка при загрузке данных');
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleExamClick = async (examId) => {
    try {
      const studentId = localStorage.getItem('id');
      if (!studentId) {
        setError('ID студента не найден');
        return;
      }

      setLoading(true);
      const response = await axios.post(`${API_EXAM_URL}/get-exam-session`, {
        student_id: studentId,
        exam_id: examId
      });

      if (response.data.status) {
        setExamDetails(response.data);
        setViewMode('details');
      } else {
        setError('Не удалось загрузить данные экзамена');
      }
    } catch (err) {
      setError('Ошибка при загрузке данных экзамена');
      console.error('Error fetching exam details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setViewMode('list');
    setExamDetails(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (viewMode === 'details' && examDetails) {
    return (
      <div className="exam-details-container">
        <button className="back-button" onClick={handleBackClick}>
          Назад к списку экзаменов
        </button>
        
        <h2>Результаты экзамена</h2>
        <div className="exam-summary">
          <p><strong>Оценка:</strong> {parseInt(examDetails.grade)}</p>
          <p><strong>Баллы:</strong> {parseInt(examDetails.score)}</p>
        </div>

        <div className="questions-list">
          <h3>Вопросы и ответы:</h3>
          {examDetails.answers.map((answer, index) => (
            <div key={answer.question_id} className="question-item">
              <p><strong>Вопрос {index + 1}:</strong> {answer.question}</p>
              <p><strong>Правильный ответ:</strong> {answer.correct_answer}</p>
              <p><strong>Результат:</strong> {parseInt(answer.result)} баллов</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="exams-container">
      <h1>Список экзаменов</h1>
      <div className="exams-list">
        {exams.length > 0 ? (
          exams.map((exam) => (
            <div 
              key={exam.id} 
              className="exam-card"
              onClick={() => handleExamClick(exam.id)}
            >
              <h3>{exam.name}</h3>
              <p className='redc'>{formatDate(exam.date)}</p>
            </div>
          ))
        ) : (
          <p>Нет доступных экзаменов</p>
        )}
      </div>
    </div>
  );
};

export default Exams;