import React, { useState, useEffect } from 'react';
import axios from '../../api';
import styles from './Examiner.module.css';
import { API_BASE_URL } from '../../Config';
import { API_EXAM_URL } from '../../Config';
const Examiner = () => {
  // Состояния для этапов экзамена
  const [step, setStep] = useState('selectStudent');
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examSession, setExamSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [baseScore, setBaseScore] = useState(0); // Только баллы за первые 6 вопросов
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [needsExtraQuestions, setNeedsExtraQuestions] = useState(false);

  // API URLs
  const API_URL_USERS = `${API_BASE_URL}/api/get-users-by-role`;
  const API_URL_EXAMS = `${API_EXAM_URL}/get-all-exams`;
  const API_URL_CREATE_SESSION = `${API_EXAM_URL}/add-exam-session`;
  const API_URL_GET_QUESTION = `${API_EXAM_URL}/get-random-question-by-examid`;
  const API_URL_ADD_ANSWER = `${API_EXAM_URL}/add-exam-answer`;
  const API_URL_UPDATE_RESULT = `${API_EXAM_URL}/update-exam-result`;

  // Загрузка студентов
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(API_URL_USERS, { role: 'student' });
        if (response.data.status) {
          setStudents(response.data.res);
          setFilteredStudents(response.data.res);
        }
      } catch (err) {
        setError('Ошибка загрузки списка студентов');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Фильтрация студентов
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Выбор студента
  const handleStudentSelected = async (student) => {
    setSelectedStudent(student);
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL_EXAMS);
      if (response.data.status) {
        setExams(response.data.exams);
        setStep('selectExam');
      }
    } catch (err) {
      setError('Ошибка загрузки списка экзаменов');
    } finally {
      setIsLoading(false);
    }
  };

  // Выбор экзамена и создание сессии
  const handleExamSelected = async (exam) => {
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      const response = await axios.post(API_URL_CREATE_SESSION, {
        student_id: selectedStudent.id,
        exam_id: exam.id
      });
      
      if (response.data) {
        setExamSession(response.data);
        await fetchQuestion(exam.id);
        setStep('examSession');
      }
    } catch (err) {
      setError('Ошибка создания экзаменационной сессии');
    } finally {
      setIsLoading(false);
    }
  };

  // Получение вопроса
  const fetchQuestion = async (examId) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(API_URL_GET_QUESTION, {
        exam_id: examId
      });
      
      if (response.data && response.data.status) {
        setCurrentQuestion({
          id: response.data.question_id,
          text: response.data.question,
          answer: response.data.answer
        });
        setShowAnswer(false);
      } else {
        setError('Не удалось получить вопрос');
      }
    } catch (err) {
      setError('Ошибка загрузки вопроса');
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка ответа
  const handleAnswerSubmit = async (result) => {
    setIsLoading(true);
    try {
      // Сохраняем ответ на сервере
      await axios.post(API_URL_ADD_ANSWER, {
        exam_session_id: examSession.session_id,
        question_id: currentQuestion.id,
        result: result
      });

      const newQuestionsAnswered = questionsAnswered + 1;
      const newScore = score + result;
      
      setScore(newScore);
      setQuestionsAnswered(newQuestionsAnswered);

      // Основные 6 вопросов
      if (newQuestionsAnswered === 6) {
        setBaseScore(newScore); // Фиксируем баллы за основные вопросы
        const decimalPart = newScore % 1;
        
        if (decimalPart === 0) {
          // Целое число - завершаем экзамен
          const finalGrade = calculateGrade(newScore);
          await finalizeExam(finalGrade);
        } else {
          // Нужны дополнительные вопросы
          setNeedsExtraQuestions(true);
          await fetchQuestion(selectedExam.id);
        }
      } 
      // Дополнительные вопросы
      else if (newQuestionsAnswered > 6 && needsExtraQuestions) {
        if (result === 0.5) {
          // Продолжаем задавать доп. вопросы
          await fetchQuestion(selectedExam.id);
        } else {
          // Определяем итоговую оценку
          const finalScore = result === 0 ? Math.floor(baseScore) : Math.ceil(baseScore);
          const finalGrade = calculateGrade(finalScore);
          await finalizeExam(finalGrade);
        }
      } 
      // Основные вопросы (1-5)
      else {
        await fetchQuestion(selectedExam.id);
      }
    } catch (err) {
      setError('Ошибка сохранения ответа');
    } finally {
      setIsLoading(false);
    }
  };

  // Расчет оценки по баллам
  const calculateGrade = (score) => {
    if (score >= 6) return 5;
    if (score >= 5) return 4;
    if (score >= 4) return 3;
    return 2;
  };

  // Завершение экзамена
  const finalizeExam = async (finalGrade) => {
    try {
      await axios.post(API_URL_UPDATE_RESULT, {
        exam_session_id: examSession.session_id,
        result: finalGrade
      });
      
      setFinalResult({
        score: baseScore,
        grade: finalGrade,
        needsExtra: needsExtraQuestions,
        totalQuestions: questionsAnswered
      });
      setStep('result');
    } catch (err) {
      setError('Ошибка сохранения итоговой оценки');
    }
  };

  // Начать новый экзамен
  const startNewExam = () => {
    setStep('selectStudent');
    setSelectedStudent(null);
    setSelectedExam(null);
    setExamSession(null);
    setCurrentQuestion(null);
    setShowAnswer(false);
    setScore(0);
    setQuestionsAnswered(0);
    setBaseScore(0);
    setFinalResult(null);
    setError('');
    setNeedsExtraQuestions(false);
  };

  return (
    <div className={styles.examinerContainer}>
      <h1 className={styles.title}>Панель экзаменатора</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      {isLoading && <div className={styles.loading}>Загрузка...</div>}

      {/* Выбор студента */}
      {step === 'selectStudent' && (
        <div className={styles.stepContainer}>
          <h2>Выберите студента</h2>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Поиск по имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.listContainer}>
            {filteredStudents.map(student => (
              <div 
                key={student.id} 
                className={styles.listItem}
                onClick={() => handleStudentSelected(student)}
              >
                {student.full_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Выбор экзамена */}
      {step === 'selectExam' && (
        <div className={styles.stepContainer}>
          <h2>Выберите экзамен для {selectedStudent.full_name}</h2>
          <div className={styles.listContainer}>
            {exams.map(exam => (
              <div 
                key={exam.id} 
                className={styles.listItem}
                onClick={() => handleExamSelected(exam)}
              >
                <div className={styles.examName}>{exam.name}</div>
                <div className={styles.examDate}>{new Date(exam.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
          <button 
            className={styles.backButton}
            onClick={() => setStep('selectStudent')}
          >
            Назад
          </button>
        </div>
      )}

      {/* Экзаменационная сессия */}
      {step === 'examSession' && (
        <div className={styles.examSession}>
          <h2>Экзамен: {selectedExam.name}</h2>
          <h3>Студент: {selectedStudent.full_name}</h3>
          
          {currentQuestion ? (
            <div className={styles.questionContainer}>
              <div className={styles.questionCounter}>
                Вопрос {questionsAnswered + 1} 
                {questionsAnswered >= 6 ? ' (дополнительный)' : ''}
              </div>
              <div className={styles.questionText}>{currentQuestion.text}</div>
              
              <button 
                className={styles.toggleAnswerButton}
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {showAnswer ? 'Скрыть ответ' : 'Показать ответ'}
              </button>
              
              {showAnswer && (
                <div className={styles.answerText}>
                  <strong>Ответ:</strong> {currentQuestion.answer}
                </div>
              )}
              
              <div className={styles.scoreButtons}>
                <button onClick={() => handleAnswerSubmit(0)} className={styles.scoreButton}>0</button>
                <button onClick={() => handleAnswerSubmit(0.5)} className={styles.scoreButton}>0.5</button>
                <button onClick={() => handleAnswerSubmit(1)} className={styles.scoreButton}>1</button>
              </div>
            </div>
          ) : (
            <div className={styles.noQuestion}>
              {isLoading ? 'Загрузка вопроса...' : 'Не удалось загрузить вопрос'}
            </div>
          )}
          
          <div className={styles.currentScore}>
            Текущий счет: {questionsAnswered <= 6 ? score.toFixed(1) : baseScore.toFixed(1)} баллов ({questionsAnswered} вопросов)
          </div>
        </div>
      )}

      {/* Результаты */}
      {step === 'result' && finalResult && (
        <div className={styles.resultContainer}>
          <h2>Экзамен завершен</h2>
          <h3>Студент: {selectedStudent.full_name}</h3>
          <h3>Экзамен: {selectedExam.name}</h3>
          
          <div className={styles.resultSummary}>
            <p>Баллы за основные вопросы: <strong>{finalResult.score.toFixed(1)}</strong></p>
            <p>Всего задано вопросов: <strong>{finalResult.totalQuestions}</strong></p>
            <p>Итоговая оценка: <strong>{finalResult.grade}</strong></p>
            {finalResult.needsExtra && <p>Потребовались дополнительные вопросы</p>}
          </div>
          
          <button 
            className={styles.newExamButton}
            onClick={startNewExam}
          >
            Начать новый экзамен
          </button>
        </div>
      )}
    </div>
  );
};

export default Examiner;