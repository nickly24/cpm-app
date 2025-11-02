
import './Exam.css'
import React, { useEffect, useState } from 'react';
import axios from '../../api';
import './Examiner.module.css';
import { API_BASE_URL } from '../../Config';
import { API_EXAM_URL } from '../../Config';
const Exam = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [exams, setExams] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [extraMode, setExtraMode] = useState(false);

  const studentUrl = `${API_BASE_URL}/api/get-users-by-role`;
  const examUrl = `${API_EXAM_URL}/get-all-exams`;
  const createSessionUrl = `${API_EXAM_URL}/add-exam-session`;
  const questionUrl = `${API_EXAM_URL}/get-random-question-by-examid`;
  const answerUrl = `${API_EXAM_URL}/add-exam-answer`;
  const resultUrl = `${API_EXAM_URL}/update-exam-result`;

  useEffect(() => {
    axios.post(studentUrl, { role: 'student' }).then(res => {
      if (res.data.status) setStudents(res.data.res);
    });

    axios.get(examUrl).then(res => {
      if (res.data.status) setExams(res.data.exams);
    });
  }, []);

  const startExam = () => {
    axios.post(createSessionUrl, {
      student_id: selectedStudent,
      exam_id: selectedExam
    }).then(res => {
      if (res.data.session_id) {
        setSessionId(res.data.session_id);
        loadQuestion();
      }
    });
  };

  const loadQuestion = () => {
    axios.post(questionUrl, { exam_id: selectedExam }).then(res => {
      if (res.data.status) {
        setQuestion(res.data);
        setShowAnswer(false);
      }
    });
  };

  const submitAnswer = (value) => {
    axios.post(answerUrl, {
      exam_session_id: sessionId,
      question_id: question.question_id,
      result: value
    }).then(() => {
      const newScore = score + value;
      const newCount = answerCount + 1;

      setScore(newScore);
      setAnswerCount(newCount);

      // Определяем завершение
      if (!extraMode && newCount === 6) {
        if (Number.isInteger(newScore)) {
          finishExam(newScore);
        } else {
          setExtraMode(true);
          loadQuestion();
        }
      } else if (extraMode) {
        if (value === 0) {
          finishExam(Math.floor(newScore));
        } else if (value === 1) {
          finishExam(Math.ceil(newScore));
        } else {
          loadQuestion();
        }
      } else {
        loadQuestion();
      }
    });
  };

  const finishExam = (finalScore) => {
    axios.post(resultUrl, {
      exam_session_id: sessionId,
      result: finalScore
    }).then(() => {
      alert(`Экзамен завершен. Итоговая оценка: ${gradeByScore(finalScore)}`);
      window.location.reload();
    });
  };

  const gradeByScore = (score) => {
    if (score >= 6) return 'отлично';
    if (score >= 5) return 'хорошо';
    if (score >= 4) return 'удовлетворительно';
    return 'неудовлетворительно';
  };

  return (
    <div className="examiner-container">
      {!sessionId ? (
        <div className="examiner-setup">
          <h2>Выбор студента</h2>
          <input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ul className="selector-list">
            {students
              .filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(s => (
                <li key={s.id} onClick={() => setSelectedStudent(s.id)} className={selectedStudent === s.id ? 'active' : ''}>
                  {s.full_name}
                </li>
              ))}
          </ul>


<h2>Выбор экзамена</h2>
          <ul className="selector-list">
            {exams.map(e => (
              <li key={e.id} onClick={() => setSelectedExam(e.id)} className={selectedExam === e.id ? 'active' : ''}>
                {e.name}
              </li>
            ))}
          </ul>

          <button disabled={!selectedStudent || !selectedExam} onClick={startExam}>
            Начать экзамен
          </button>
        </div>
      ) : (
        <div className="examiner-exam">
          <h2>Вопрос</h2>
          <p>{question?.question}</p>
          <button onClick={() => setShowAnswer(!showAnswer)}>
            {showAnswer ? 'Скрыть ответ' : 'Показать ответ'}
          </button>
          {showAnswer && <div className="answer-block">{question.answer}</div>}

          <div className="score-buttons">
            <button onClick={() => submitAnswer(0)}>0 баллов</button>
            <button onClick={() => submitAnswer(0.5)}>0.5 балла</button>
            <button onClick={() => submitAnswer(1)}>1 балл</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;