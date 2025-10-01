import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, API_EXAM_URL } from "../../../Config";
import "./TestResultsView.css";

export default function TestResultsView() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSessions, setStudentSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTestDetails, setLoadingTestDetails] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [testSearchTerm, setTestSearchTerm] = useState("");
  const [currentStudentPage, setCurrentStudentPage] = useState(1);
  const [currentTestPage, setCurrentTestPage] = useState(1);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showTestDetailsModal, setShowTestDetailsModal] = useState(false);
  const [showStudentList, setShowStudentList] = useState(true);
  
  const studentsPerPage = 10;
  const sessionsPerPage = 6;

  // Загрузка списка студентов
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${API_BASE_URL}/api/get-users-by-role`, { 
          role: "student" 
        });
        setStudents(response.data.res || []);
      } catch (error) {
        console.error("Ошибка при загрузке студентов:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Загрузка результатов выбранного студента
  const fetchStudentResults = async (studentId) => {
    try {
      setLoading(true);
      setStudentSessions([]);
      setSelectedSession(null);
      setSessionStats(null);
      
      const response = await fetch(`${API_EXAM_URL}test-sessions/student/${studentId}`);
      if (response.ok) {
        const sessions = await response.json();
        setStudentSessions(sessions);
      } else {
        console.error("Ошибка при загрузке результатов студента");
      }
    } catch (error) {
      console.error("Ошибка при загрузке результатов:", error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка детальной статистики сессии
  const fetchSessionStats = async (sessionId) => {
    try {
      setLoadingStats(true);
      const response = await fetch(`${API_EXAM_URL}test-session/${sessionId}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setSessionStats(stats);
        setShowStatsModal(true);
      } else {
        console.error("Ошибка при загрузке статистики сессии");
      }
    } catch (error) {
      console.error("Ошибка при загрузке статистики:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Загрузка деталей теста с вопросами и ответами
  const fetchTestDetails = async (session) => {
    try {
      setLoadingTestDetails(true);
      setSelectedSession(session);
      
      // Загружаем детали теста
      const testResponse = await fetch(`${API_EXAM_URL}test/${session.testId}`);
      if (!testResponse.ok) {
        console.error("Ошибка при загрузке теста");
        return;
      }
      const testData = await testResponse.json();
      
      // Загружаем статистику для получения ответов студента
      const statsResponse = await fetch(`${API_EXAM_URL}test-session/${session.id}/stats`);
      if (!statsResponse.ok) {
        console.error("Ошибка при загрузке статистики");
        return;
      }
      const statsData = await statsResponse.json();
      
      // Объединяем данные теста с ответами студента
      const testWithAnswers = {
        ...testData,
        studentAnswers: statsData.answers || [],
        sessionInfo: {
          score: session.score,
          timeSpent: session.timeSpentMinutes,
          completedAt: session.completedAt
        }
      };
      
      setTestDetails(testWithAnswers);
      setShowTestDetailsModal(true);
    } catch (error) {
      console.error("Ошибка при загрузке деталей теста:", error);
    } finally {
      setLoadingTestDetails(false);
    }
  };

  // Обработка выбора студента
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowStudentList(false);
    fetchStudentResults(student.id);
    setCurrentTestPage(1);
  };

  // Возврат к списку студентов
  const handleBackToStudents = () => {
    setShowStudentList(true);
    setSelectedStudent(null);
    setStudentSessions([]);
    setSelectedSession(null);
    setSessionStats(null);
    setTestSearchTerm("");
  };

  // Обработка выбора сессии для детального просмотра
  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    fetchSessionStats(session.id);
  };

  // Получение ответа студента на вопрос
  const getStudentAnswer = (questionId) => {
    if (!testDetails?.studentAnswers) return null;
    return testDetails.studentAnswers.find(answer => answer.questionId === questionId);
  };

  // Получение правильных ответов для вопроса
  const getCorrectAnswers = (question) => {
    if (question.type === 'text') {
      return question.correctAnswers || [];
    } else {
      return question.answers.filter(answer => answer.isCorrect);
    }
  };

  // Проверка правильности ответа
  const isAnswerCorrect = (question, studentAnswer) => {
    if (!studentAnswer) return false;
    
    if (question.type === 'single') {
      return studentAnswer.selectedAnswer && 
             question.answers.find(a => a.id === studentAnswer.selectedAnswer)?.isCorrect;
    } else if (question.type === 'multiple') {
      const correctAnswers = question.answers.filter(a => a.isCorrect).map(a => a.id);
      const selectedAnswers = studentAnswer.selectedAnswers || [];
      return correctAnswers.length === selectedAnswers.length && 
             correctAnswers.every(id => selectedAnswers.includes(id));
    } else if (question.type === 'text') {
      const correctAnswers = question.correctAnswers || [];
      return correctAnswers.some(correct => 
        correct.toLowerCase().trim() === studentAnswer.textAnswer?.toLowerCase().trim()
      );
    }
    return false;
  };

  // Фильтрация студентов по поисковому запросу
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  // Фильтрация сессий по поисковому запросу
  const filteredSessions = studentSessions.filter(session =>
    session.testTitle.toLowerCase().includes(testSearchTerm.toLowerCase())
  );

  // Пагинация студентов
  const totalStudentPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startStudentIndex = (currentStudentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(startStudentIndex, startStudentIndex + studentsPerPage);

  // Пагинация сессий
  const totalTestPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const startTestIndex = (currentTestPage - 1) * sessionsPerPage;
  const paginatedSessions = filteredSessions.slice(startTestIndex, startTestIndex + sessionsPerPage);

  // Форматирование даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Форматирование времени
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ч ${mins}м`;
    }
    return `${mins}м`;
  };

  // Получение цвета для рейтинга
  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  // Умная генерация страниц для пагинации
  const generatePageNumbers = (currentPage, totalPages) => {
    const pages = [];
    const maxVisible = 7; // Максимум видимых страниц
    
    if (totalPages <= maxVisible) {
      // Если страниц мало, показываем все
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Логика для большого количества страниц
      if (currentPage <= 4) {
        // Показываем первые 5 страниц + ... + последняя
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Показываем первую + ... + последние 5 страниц
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Показываем первую + ... + текущая область + ... + последняя
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="test_view_res_container">
      <div className="test_view_res_header">
        <h2 className="test_view_res_title">Просмотр результатов тестов</h2>
        <p className="test_view_res_subtitle">
          Выберите студента для просмотра его результатов прохождения тестов
        </p>
      </div>

      {/* Выбор студента */}
      {showStudentList && (
        <div className="test_view_res_student_selection">
          <h3 className="test_view_res_section_title">Выбор студента</h3>
          
          {/* Поиск студентов */}
          <div className="test_view_res_student_search">
            <input
              type="text"
              placeholder="Поиск по имени студента..."
              value={studentSearchTerm}
              onChange={(e) => {
                setStudentSearchTerm(e.target.value);
                setCurrentStudentPage(1);
              }}
              className="test_view_res_student_search_input"
            />
          </div>

          {loading ? (
            <div className="test_view_res_loading">Загрузка студентов...</div>
          ) : (
            <>
              <div className="test_view_res_students_table">
                <div className="test_view_res_students_table_header">
                  <div className="test_view_res_table_col_name">Имя студента</div>
                  <div className="test_view_res_table_col_id">ID</div>
                  <div className="test_view_res_table_col_actions">Действия</div>
                </div>
                
                {paginatedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="test_view_res_student_row"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="test_view_res_student_cell">
                      <div className="test_view_res_student_avatar_small">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="test_view_res_student_name">{student.full_name}</span>
                    </div>
                    <div className="test_view_res_student_cell">
                      <span className="test_view_res_student_id">{student.id}</span>
                    </div>
                    <div className="test_view_res_student_cell">
                      <button 
                        className="test_view_res_select_student_btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStudentSelect(student);
                        }}
                      >
                        Выбрать
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Пагинация студентов */}
              {totalStudentPages > 1 && (
                <div className="test_view_res_pagination">
                  <button
                    className="test_view_res_pagination_btn"
                    onClick={() => setCurrentStudentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentStudentPage === 1}
                  >
                    ← Назад
                  </button>
                  
                  <div className="test_view_res_pagination_pages">
                    {generatePageNumbers(currentStudentPage, totalStudentPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="test_view_res_pagination_ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`test_view_res_pagination_page ${
                            currentStudentPage === page ? 'test_view_res_pagination_page_active' : ''
                          }`}
                          onClick={() => setCurrentStudentPage(page)}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  
                  <button
                    className="test_view_res_pagination_btn"
                    onClick={() => setCurrentStudentPage(prev => Math.min(prev + 1, totalStudentPages))}
                    disabled={currentStudentPage === totalStudentPages}
                  >
                    Вперед →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Результаты выбранного студента */}
      {selectedStudent && !showStudentList && (
        <div className="test_view_res_results_section">
          <div className="test_view_res_results_header">
            <div className="test_view_res_results_title_section">
              <button 
                className="test_view_res_back_btn"
                onClick={handleBackToStudents}
              >
                ← Назад к списку студентов
              </button>
              <h3 className="test_view_res_section_title">
                Результаты студента: {selectedStudent.full_name}
              </h3>
            </div>
          </div>
          
          <div className="test_view_res_search_section">
            <div className="test_view_res_search">
              <input
                type="text"
                placeholder="Поиск по названию теста..."
                value={testSearchTerm}
                onChange={(e) => {
                  setTestSearchTerm(e.target.value);
                  setCurrentTestPage(1);
                }}
                className="test_view_res_search_input"
              />
            </div>
          </div>

          {loading ? (
            <div className="test_view_res_loading">Загрузка результатов...</div>
          ) : studentSessions.length === 0 ? (
            <div className="test_view_res_empty">
              <div className="test_view_res_empty_icon">📊</div>
              <h4>Нет результатов</h4>
              <p>У данного студента пока нет завершенных тестов</p>
            </div>
          ) : (
            <>
              <div className="test_view_res_sessions_grid">
                {paginatedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="test_view_res_session_card"
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div className="test_view_res_session_header">
                      <h4 className="test_view_res_session_title">{session.testTitle}</h4>
                      <div 
                        className="test_view_res_session_score"
                        style={{ color: getScoreColor(session.score) }}
                      >
                        {session.score}%
                      </div>
                    </div>
                    
                    <div className="test_view_res_session_details">
                      <div className="test_view_res_session_detail">
                        <span className="test_view_res_detail_label">Дата:</span>
                        <span className="test_view_res_detail_value">
                          {formatDate(session.completedAt)}
                        </span>
                      </div>
                      <div className="test_view_res_session_detail">
                        <span className="test_view_res_detail_label">Время:</span>
                        <span className="test_view_res_detail_value">
                          {formatTime(session.timeSpentMinutes)}
                        </span>
                      </div>
                    </div>

                    <div className="test_view_res_session_actions">
                      <button 
                        className="test_view_res_view_stats_btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionSelect(session);
                        }}
                        disabled={loadingStats}
                      >
                        {loadingStats ? 'Загрузка...' : 'Статистика'}
                      </button>
                      <button 
                        className="test_view_res_view_questions_btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchTestDetails(session);
                        }}
                        disabled={loadingTestDetails}
                      >
                        {loadingTestDetails ? 'Загрузка...' : 'Вопросы'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Пагинация */}
              {totalTestPages > 1 && (
                <div className="test_view_res_pagination">
                  <button
                    className="test_view_res_pagination_btn"
                    onClick={() => setCurrentTestPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentTestPage === 1}
                  >
                    ← Назад
                  </button>
                  
                  <div className="test_view_res_pagination_pages">
                    {generatePageNumbers(currentTestPage, totalTestPages).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="test_view_res_pagination_ellipsis">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`test_view_res_pagination_page ${
                            currentTestPage === page ? 'test_view_res_pagination_page_active' : ''
                          }`}
                          onClick={() => setCurrentTestPage(page)}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  
                  <button
                    className="test_view_res_pagination_btn"
                    onClick={() => setCurrentTestPage(prev => Math.min(prev + 1, totalTestPages))}
                    disabled={currentTestPage === totalTestPages}
                  >
                    Вперед →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Модальное окно с детальной статистикой */}
      {showStatsModal && sessionStats && (
        <div className="test_view_res_modal_overlay" onClick={() => setShowStatsModal(false)}>
          <div className="test_view_res_modal" onClick={(e) => e.stopPropagation()}>
            <div className="test_view_res_modal_header">
              <h3 className="test_view_res_modal_title">Детальная статистика</h3>
              <button
                className="test_view_res_modal_close"
                onClick={() => setShowStatsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="test_view_res_modal_content">
              <div className="test_view_res_stats_summary">
                <div className="test_view_res_stat_item">
                  <span className="test_view_res_stat_label">Тест:</span>
                  <span className="test_view_res_stat_value">{sessionStats.testTitle}</span>
                </div>
                <div className="test_view_res_stat_item">
                  <span className="test_view_res_stat_label">Всего вопросов:</span>
                  <span className="test_view_res_stat_value">{sessionStats.totalQuestions}</span>
                </div>
                <div className="test_view_res_stat_item">
                  <span className="test_view_res_stat_label">Правильных ответов:</span>
                  <span className="test_view_res_stat_value">{sessionStats.correctAnswers}</span>
                </div>
                <div className="test_view_res_stat_item">
                  <span className="test_view_res_stat_label">Точность:</span>
                  <span className="test_view_res_stat_value">{sessionStats.accuracy}%</span>
                </div>
                <div className="test_view_res_stat_item">
                  <span className="test_view_res_stat_label">Рейтинговый балл:</span>
                  <span className="test_view_res_stat_value">{sessionStats.totalPoints}%</span>
                </div>
                <div className="test_view_res_stat_item">
                  <span className="test_view_res_stat_label">Время выполнения:</span>
                  <span className="test_view_res_stat_value">{formatTime(sessionStats.timeSpentMinutes)}</span>
                </div>
              </div>

              {/* Статистика по типам вопросов */}
              <div className="test_view_res_question_types">
                <h4 className="test_view_res_question_types_title">Статистика по типам вопросов</h4>
                <div className="test_view_res_question_types_grid">
                  {Object.entries(sessionStats.questionTypes || {}).map(([type, stats]) => (
                    <div key={type} className="test_view_res_question_type_card">
                      <h5 className="test_view_res_question_type_name">
                        {type === 'single' ? 'Одиночный выбор' : 
                         type === 'multiple' ? 'Множественный выбор' : 'Текстовый ответ'}
                      </h5>
                      <div className="test_view_res_question_type_stats">
                        <div className="test_view_res_question_type_stat">
                          <span>Всего: {stats.count}</span>
                        </div>
                        <div className="test_view_res_question_type_stat">
                          <span>Правильно: {stats.correct}</span>
                        </div>
                        <div className="test_view_res_question_type_stat">
                          <span>Баллы: {stats.points}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с деталями теста и ответами */}
      {showTestDetailsModal && testDetails && (
        <div className="test_view_res_modal_overlay" onClick={() => setShowTestDetailsModal(false)}>
          <div className="test_view_res_modal test_view_res_questions_modal" onClick={(e) => e.stopPropagation()}>
            <div className="test_view_res_modal_header">
              <h3 className="test_view_res_modal_title">
                Детали теста: {testDetails.title}
              </h3>
              <button
                className="test_view_res_modal_close"
                onClick={() => setShowTestDetailsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="test_view_res_modal_content">
              {/* Информация о сессии */}
              <div className="test_view_res_session_info">
                <div className="test_view_res_session_info_item">
                  <span className="test_view_res_session_info_label">Рейтинговый балл:</span>
                  <span className="test_view_res_session_info_value" style={{ color: getScoreColor(testDetails.sessionInfo.score) }}>
                    {testDetails.sessionInfo.score}%
                  </span>
                </div>
                <div className="test_view_res_session_info_item">
                  <span className="test_view_res_session_info_label">Время выполнения:</span>
                  <span className="test_view_res_session_info_value">{formatTime(testDetails.sessionInfo.timeSpent)}</span>
                </div>
                <div className="test_view_res_session_info_item">
                  <span className="test_view_res_session_info_label">Дата завершения:</span>
                  <span className="test_view_res_session_info_value">{formatDate(testDetails.sessionInfo.completedAt)}</span>
                </div>
              </div>

              {/* Список вопросов */}
              <div className="test_view_res_questions_list">
                <h4 className="test_view_res_questions_title">Вопросы и ответы:</h4>
                {testDetails.questions?.map((question, index) => {
                  const studentAnswer = getStudentAnswer(question.questionId);
                  const correctAnswers = getCorrectAnswers(question);
                  const isCorrect = isAnswerCorrect(question, studentAnswer);
                  
                  return (
                    <div key={question.questionId} className="test_view_res_question_item">
                      <div className="test_view_res_question_header">
                        <h5 className="test_view_res_question_title">
                          Вопрос {index + 1}: {question.text}
                        </h5>
                        <div className={`test_view_res_question_status ${isCorrect ? 'correct' : 'incorrect'}`}>
                          {isCorrect ? '✓ Правильно' : '✗ Неправильно'}
                        </div>
                      </div>

                      <div className="test_view_res_question_content">
                        {/* Ответ студента */}
                        <div className="test_view_res_student_answer">
                          <h6 className="test_view_res_answer_title">Ответ студента:</h6>
                          {question.type === 'single' && (
                            <div className="test_view_res_answer_content">
                              {studentAnswer?.selectedAnswer ? (
                                <span className="test_view_res_selected_answer">
                                  {question.answers.find(a => a.id === studentAnswer.selectedAnswer)?.text || 'Не выбран'}
                                </span>
                              ) : (
                                <span className="test_view_res_no_answer">Не отвечен</span>
                              )}
                            </div>
                          )}
                          
                          {question.type === 'multiple' && (
                            <div className="test_view_res_answer_content">
                              {studentAnswer?.selectedAnswers?.length > 0 ? (
                                <div className="test_view_res_selected_answers">
                                  {studentAnswer.selectedAnswers.map(answerId => {
                                    const answer = question.answers.find(a => a.id === answerId);
                                    return answer ? (
                                      <span key={answerId} className="test_view_res_selected_answer_item">
                                        {answer.text}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : (
                                <span className="test_view_res_no_answer">Не отвечен</span>
                              )}
                            </div>
                          )}
                          
                          {question.type === 'text' && (
                            <div className="test_view_res_answer_content">
                              {studentAnswer?.textAnswer ? (
                                <span className="test_view_res_text_answer">
                                  "{studentAnswer.textAnswer}"
                                </span>
                              ) : (
                                <span className="test_view_res_no_answer">Не отвечен</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Правильные ответы */}
                        <div className="test_view_res_correct_answers">
                          <h6 className="test_view_res_answer_title">Правильные ответы:</h6>
                          <div className="test_view_res_answer_content">
                            {question.type === 'text' ? (
                              <div className="test_view_res_correct_text_answers">
                                {correctAnswers.map((answer, idx) => (
                                  <span key={idx} className="test_view_res_correct_answer_item">
                                    "{answer}"
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="test_view_res_correct_choice_answers">
                                {correctAnswers.map((answer, idx) => (
                                  <span key={idx} className="test_view_res_correct_answer_item">
                                    {answer.text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Баллы */}
                        <div className="test_view_res_question_points">
                          <span className="test_view_res_points_label">Баллы:</span>
                          <span className="test_view_res_points_value">
                            {studentAnswer?.points || 0} / {question.points}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
