import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import './ExamsInfo.css';
import { API_EXAM_URL } from '../../../Config';
const ExamsInfo = ({ studentId }) => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.post(`${API_EXAM_URL}/get-exams-w-results-student`, {
          student_id: studentId
        });
        setExams(response.data);
        setFilteredExams(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [studentId]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredExams(exams);
      setCurrentExamIndex(0);
    } else {
      const filtered = exams.filter(exam => 
        exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExams(filtered);
      setCurrentExamIndex(0);
    }
  }, [searchTerm, exams]);

  const handlePrev = () => {
    setCurrentExamIndex(prev => 
      prev === 0 ? filteredExams.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentExamIndex(prev => 
      prev === filteredExams.length - 1 ? 0 : prev + 1
    );
  };

  const handleExamSelect = (examName) => {
    setSearchTerm(examName);
    const index = exams.findIndex(exam => 
      exam.exam_name.toLowerCase() === examName.toLowerCase()
    );
    if (index !== -1) {
      setCurrentExamIndex(index);
    }
  };

  if (loading) return <div className="loading">Загрузка данных...</div>;
  if (error) return <div className="error">Ошибка: {error}</div>;
  if (exams.length === 0) return <div className="no-exams">Нет записей об экзаменах</div>;

  const currentExam = filteredExams[currentExamIndex];

  return (
    <div className="ex">
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск экзаменов..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <div className="search-results">
            {filteredExams.map((exam) => (
              <div 
                key={exam.exam_id} 
                className="search-result-item"
                onClick={() => handleExamSelect(exam.exam_name)}
              >
                {exam.exam_name} ({exam.exam_date})
              </div>
            ))}
          </div>
        )}
      </div>

      {filteredExams.length > 0 ? (
        <div className="exam-slider-container">
          <div className="exam-slider">
            <div className="exam-cad">
              <div className="exam-header">
                <h3 className="exam-title">{currentExam.exam_name}</h3>
                <span className="exam-date">{currentExam.exam_date}</span>
                <div className="exam-result">Результат: {currentExam.session_result}</div>
              </div>
              
              <div className="questions-list">
                {currentExam.questions.map((question, index) => (
                  <div key={`${question.question_id}-${index}`} className="question-item">
                    <div className="question-text">{question.question_text}</div>
                    <div className="question-answer">Правильный ответ: {question.correct_answer}</div>
                    <div className={`question-result ${question.student_answer_result === 1 ? 'correct' : question.student_answer_result === 0 ? 'wrong' : 'partial'}`}>
                      Результат: {Math.round(question.student_answer_result * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="slider-controls">
            <button onClick={handlePrev} className="slider-button prev-button">
              Предыдущий экзамен
            </button>
            <div className="pagination-info">
              {currentExamIndex + 1} / {filteredExams.length}
            </div>
            <button onClick={handleNext} className="slider-button next-button">
              Следующий экзамен
            </button>
          </div>
        </div>
      ) : (
        <div className="no-results">Нет результатов по вашему запросу</div>
      )}
    </div>
  );
};

export default ExamsInfo;