import { useState, useEffect } from 'react';
import './Tests.css';
import { API_EXAM_URL } from '../../Config';

export default function Tests() {
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTest, setCurrentTest] = useState(null);
  const [testSession, setTestSession] = useState(null);
  const [completedTests, setCompletedTests] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [testStats, setTestStats] = useState({});

  // Загрузка направлений при монтировании компонента
  useEffect(() => {
    loadDirections();
    
    // Проверяем, есть ли сохраненная сессия теста
    const savedSession = localStorage.getItem('testSession');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        // Проверяем, не истекло ли время
        const now = Date.now();
        const endTime = parsedSession.startTime + parsedSession.timeLimit;
        
        if (now < endTime) {
          // Восстанавливаем тест
          loadTestFromSession(parsedSession);
        } else {
          // Время истекло, очищаем сессию
          localStorage.removeItem('testSession');
        }
      } catch (error) {
        console.error('Ошибка восстановления сессии:', error);
        localStorage.removeItem('testSession');
      }
    }
  }, []);

  // Загрузка тестов при выборе направления
  useEffect(() => {
    if (selectedDirection) {
      loadTests(selectedDirection);
    }
  }, [selectedDirection]);

  const loadDirections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_EXAM_URL}/directions`);
      if (!response.ok) throw new Error('Ошибка загрузки направлений');
      const data = await response.json();
      setDirections(data);
    } catch (err) {
      setError('Не удалось загрузить направления: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStudentId = () => {
    return localStorage.getItem('id');
  };

  const loadCompletedTests = async () => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const response = await fetch(`${API_EXAM_URL}/test-sessions/student/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded completed tests:', data);
        setCompletedTests(data);
        
        // Загружаем детальную статистику для каждого теста
        const statsPromises = data.map(async (test) => {
          try {
            const statsResponse = await fetch(`${API_EXAM_URL}/test-session/${test.id}/stats`);
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return { testId: test.testId, stats };
            }
          } catch (err) {
            console.error('Ошибка загрузки статистики для теста', test.testId, err);
          }
          return { testId: test.testId, stats: null };
        });
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap = {};
        statsResults.forEach(({ testId, stats }) => {
          if (stats) {
            statsMap[testId] = stats;
          }
        });
        setTestStats(statsMap);
      }
    } catch (err) {
      console.error('Ошибка загрузки сданных тестов:', err);
    }
  };

  const loadTests = async (direction) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_EXAM_URL}/tests/${encodeURIComponent(direction)}`);
      if (!response.ok) throw new Error('Ошибка загрузки тестов');
      const data = await response.json();
      setTests(data);
      
      // Загружаем сданные тесты для этого направления
      await loadCompletedTests();
    } catch (err) {
      setError('Не удалось загрузить тесты: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTestFromSession = async (session) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_EXAM_URL}/test/${session.testId}`);
      if (!response.ok) throw new Error('Тест не найден');
      const testData = await response.json();
      setCurrentTest(testData);
      setTestSession(session);
    } catch (err) {
      setError('Не удалось восстановить тест: ' + err.message);
      localStorage.removeItem('testSession');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId, practiceMode = false) => {
    // Проверяем, не сдан ли уже этот тест (только если не режим тренировки)
    const isAlreadyCompleted = completedTests.some(completed => completed.testId === testId);
    if (isAlreadyCompleted && !practiceMode) {
      setError('Этот тест уже сдан. Повторное прохождение не разрешено.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_EXAM_URL}/test/${testId}`);
      if (!response.ok) throw new Error('Тест не найден');
      const testData = await response.json();
      setCurrentTest(testData);
      setIsPracticeMode(practiceMode);
      
      // Создаем новую сессию теста
      const newSession = {
        testId: testId,
        testTitle: testData.title,
        startTime: Date.now(),
        timeLimit: testData.timeLimitMinutes * 60 * 1000, // в миллисекундах
        currentQuestionIndex: 0,
        answers: [],
        isCompleted: false,
        isPracticeMode: practiceMode
      };
      
      setTestSession(newSession);
      localStorage.setItem('testSession', JSON.stringify(newSession));
    } catch (err) {
      setError('Не удалось загрузить тест: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetTest = async () => {
    setCurrentTest(null);
    setTestSession(null);
    setTestResults(null);
    setIsPracticeMode(false);
    setError(null); // Очищаем ошибки
    localStorage.removeItem('testSession');
    
    // Обновляем список сданных тестов
    await loadCompletedTests();
  };

  const goBackToTests = async () => {
    setCurrentTest(null);
    setTestSession(null);
    setIsPracticeMode(false);
    setError(null); // Очищаем ошибки
    localStorage.removeItem('testSession');
    
    // Обновляем список сданных тестов
    await loadCompletedTests();
  };

  const goBackToDirections = () => {
    setSelectedDirection(null);
    setTests([]);
    setCurrentTest(null);
    setTestSession(null);
    localStorage.removeItem('testSession');
  };

  // Если есть результаты теста, показываем их
  if (testResults) {
    return (
      <TestResults 
        results={testResults}
        isPracticeMode={isPracticeMode}
        onBack={resetTest}
      />
    );
  }

  // Если идет тест, показываем компонент теста
  if (currentTest && testSession) {
    return (
      <TestComponent 
        test={currentTest}
        session={testSession}
        onComplete={(results) => setTestResults(results)}
        onBack={goBackToTests}
        getStudentId={getStudentId}
        isPracticeMode={isPracticeMode}
      />
    );
  }

  // Если выбрано направление, показываем список тестов
  if (selectedDirection) {
    return (
      <TestsList 
        direction={selectedDirection}
        tests={tests}
        completedTests={completedTests}
        testStats={testStats}
        loading={loading}
        error={error}
        onStartTest={startTest}
        onStartPractice={(testId) => startTest(testId, true)}
        onBack={goBackToDirections}
      />
    );
  }

  // Показываем выбор направления
  return (
    <DirectionsList 
      directions={directions}
      loading={loading}
      error={error}
      onSelectDirection={setSelectedDirection}
    />
  );
}

// Компонент выбора направления
function DirectionsList({ directions, loading, error, onSelectDirection }) {
  if (error) {
    return (
      <div className="tests_error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Попробовать снова</button>
      </div>
    );
  }

  if (loading) {
    return <div className="tests_loading">Загрузка направлений...</div>;
  }

  return (
    <div className="tests_directions">
      <h2 className="tests_title">Выберите направление</h2>
      <div className="tests_directions_list">
        {directions.map(direction => (
          <div 
            key={direction.id} 
            className="tests_direction_card"
            onClick={() => onSelectDirection(direction.name)}
          >
            <h3>{direction.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент списка тестов
function TestsList({ direction, tests, completedTests, testStats, loading, error, onStartTest, onStartPractice, onBack }) {
  if (error) {
    return (
      <div className="tests_error">
        <p>{error}</p>
        <button onClick={onBack}>Назад</button>
      </div>
    );
  }

  if (loading) {
    return <div className="tests_loading">Загрузка тестов...</div>;
  }

  const isTestAvailable = (test) => {
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    return now >= startDate && now <= endDate;
  };

  const isTestCompleted = (test) => {
    return completedTests.some(completed => completed.testId === test.id);
  };

  const getTestResult = (test) => {
    const completedTest = completedTests.find(completed => completed.testId === test.id);
    const stats = testStats[test.id];
    return { ...completedTest, stats };
  };

  return (
    <div className="tests_tests">
      <div className="tests_header">
        <button className="tests_back_btn" onClick={onBack}>← Назад</button>
        <h2 className="tests_title">Тесты по направлению: {direction}</h2>
      </div>
      
      <div className="tests_tests_list">
        {tests.length === 0 ? (
          <p className="tests_no_tests">Тесты не найдены</p>
        ) : (
          tests.map(test => {
            const completed = isTestCompleted(test);
            const testResult = getTestResult(test);
            const available = isTestAvailable(test);
            
            return (
              <div key={test.id} className={`tests_test_card ${completed ? 'completed' : ''}`}>
                <h3 className="tests_test_title">{test.title}</h3>
                <div className="tests_test_info">
                  <p><strong>Время выполнения:</strong> {test.timeLimitMinutes} минут</p>
                  <p><strong>Период проведения:</strong></p>
                  <p>{new Date(test.startDate).toLocaleDateString()} - {new Date(test.endDate).toLocaleDateString()}</p>
                  
                  {completed && testResult ? (
                    <div className="tests_test_completed_info">
                      <p className="tests_test_status completed">✅ Сдан</p>
                      <p><strong>Результат:</strong> {testResult.score || 0} баллов</p>
                      {testResult.stats ? (
                        <>
                          <p><strong>Правильных ответов:</strong> {testResult.stats.correctAnswers || 0} из {testResult.stats.totalQuestions || 0}</p>
                          <p><strong>Точность:</strong> {testResult.stats.accuracy || 0}%</p>
                        </>
                      ) : (
                        <p><em>Загрузка детальной статистики...</em></p>
                      )}
                      <p><strong>Время выполнения:</strong> {testResult.timeSpentMinutes || 0} мин</p>
                    </div>
                  ) : (
                    <p className={`tests_test_status ${available ? 'available' : 'unavailable'}`}>
                      {available ? 'Доступен' : 'Недоступен'}
                    </p>
                  )}
                </div>
                
                {!completed && (
                  <button 
                    className={`tests_start_btn ${available ? 'enabled' : 'disabled'}`}
                    onClick={() => available && onStartTest(test.id)}
                    disabled={!available}
                  >
                    {available ? 'Начать тест' : 'Недоступен'}
                  </button>
                )}
                
                {completed && (
                  <div className="tests_test_completed_actions">
                    <span className="tests_test_completed_text">Тест уже сдан</span>
                    <br />
                    <br />
                    <button 
                      className="tests_practice_btn"
                      onClick={() => onStartPractice(test.id)}
                    >
                      Потренироваться
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Компонент прохождения теста
function TestComponent({ test, session, onComplete, onBack, getStudentId, isPracticeMode }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.currentQuestionIndex);
  const [answers, setAnswers] = useState(session.answers || []);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Восстанавливаем сессию из localStorage
    const savedSession = localStorage.getItem('testSession');
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      setCurrentQuestionIndex(parsedSession.currentQuestionIndex);
      setAnswers(parsedSession.answers || []);
    }

    // Устанавливаем таймер
    const endTime = session.startTime + session.timeLimit;
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(Math.ceil(remaining / 1000));
      
      if (remaining === 0 && !isCompleted) {
        handleCompleteTest();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [session, isCompleted]);

  const handleAnswer = (questionId, answer, questionType) => {
    const newAnswers = [...answers];
    const existingAnswerIndex = newAnswers.findIndex(a => a.questionId === questionId);
    
    const answerData = {
      questionId,
      type: questionType,
      ...(questionType === 'single' ? { selectedAnswer: answer } : 
          questionType === 'multiple' ? { selectedAnswers: answer } : 
          { textAnswer: answer })
    };

    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex] = answerData;
    } else {
      newAnswers.push(answerData);
    }

    setAnswers(newAnswers);
    
    // Сохраняем в localStorage
    const updatedSession = {
      ...session,
      currentQuestionIndex,
      answers: newAnswers
    };
    localStorage.setItem('testSession', JSON.stringify(updatedSession));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      
      const updatedSession = {
        ...session,
        currentQuestionIndex: newIndex,
        answers
      };
      localStorage.setItem('testSession', JSON.stringify(updatedSession));
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteTest = async () => {
    if (isCompleted) return;
    
    setIsCompleted(true);
    
    // Рассчитываем баллы на клиенте
    const calculatedAnswers = answers.map(answer => {
      const question = test.questions.find(q => q.questionId === answer.questionId);
      if (!question) return answer;

      let isCorrect = false;
      let points = 0;

      if (question.type === 'single') {
        const correctAnswer = question.answers.find(a => a.isCorrect);
        isCorrect = answer.selectedAnswer === correctAnswer?.id;
        points = isCorrect ? question.points : 0;
      } else if (question.type === 'multiple') {
        const correctAnswers = question.answers.filter(a => a.isCorrect).map(a => a.id);
        const selectedAnswers = answer.selectedAnswers || [];
        isCorrect = correctAnswers.length === selectedAnswers.length && 
                   correctAnswers.every(id => selectedAnswers.includes(id));
        points = isCorrect ? question.points : 0;
      } else if (question.type === 'text') {
        const correctAnswers = question.correctAnswers.map(ca => ca.toLowerCase().trim());
        const userAnswer = (answer.textAnswer || '').toLowerCase().trim();
        isCorrect = correctAnswers.some(ca => ca === userAnswer);
        points = isCorrect ? question.points : 0;
      }

      return {
        ...answer,
        isCorrect,
        points
      };
    });

    // Рассчитываем общую статистику
    const totalPoints = calculatedAnswers.reduce((sum, answer) => sum + answer.points, 0);
    const maxPoints = test.questions.reduce((sum, question) => sum + question.points, 0);
    const correctAnswers = calculatedAnswers.filter(answer => answer.isCorrect).length;
    const accuracy = test.questions.length > 0 ? Math.round((correctAnswers / test.questions.length) * 100) : 0;
    const timeSpentMinutes = Math.ceil((Date.now() - session.startTime) / (1000 * 60));

    const results = {
      testTitle: test.title,
      totalPoints,
      maxPoints,
      correctAnswers,
      totalQuestions: test.questions.length,
      accuracy,
      timeSpentMinutes,
      answers: calculatedAnswers
    };

    // Отправляем результаты на сервер только если не режим тренировки
    if (!isPracticeMode) {
      try {
        const response = await fetch(`${API_EXAM_URL}/create-test-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: getStudentId(),
            testId: test._id,
            testTitle: test.title,
            answers: calculatedAnswers,
            timeSpentMinutes: timeSpentMinutes
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Тест завершен, ID сессии:', result.id);
        }
      } catch (error) {
        console.error('Ошибка отправки результатов:', error);
      }
    } else {
      console.log('Режим тренировки - результаты не отправлены на сервер');
    }

    // Очищаем localStorage
    localStorage.removeItem('testSession');
    
    // Показываем результаты
    onComplete(results);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId);

  return (
    <div className="tests_test_component">
      <div className="tests_test_header">
        <button className="tests_back_btn" onClick={onBack}>← Назад</button>
        <div className="tests_test_title_container">
          <h2 className="tests_test_title">{test.title}</h2>
          {isPracticeMode && (
            <span className="tests_practice_mode_badge">Режим тренировки</span>
          )}
        </div>
        <div className="tests_timer">
          <span className={`tests_time ${timeLeft < 300 ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="tests_progress">
        <span>Вопрос {currentQuestionIndex + 1} из {test.questions.length}</span>
        <div className="tests_progress_bar">
          <div 
            className="tests_progress_fill" 
            style={{ width: `${((currentQuestionIndex + 1) / test.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {currentQuestion && (
        <div className="tests_question">
          <h3 className="tests_question_text">{currentQuestion.text}</h3>
          <p className="tests_question_points">Баллов: {currentQuestion.points}</p>
          
          <div className="tests_question_answers">
            {currentQuestion.type === 'single' && (
              <div className="tests_single_answers">
                {currentQuestion.answers.map(answer => (
                  <label key={answer.id} className="tests_answer_option">
                    <input
                      type="radio"
                      name={`question_${currentQuestion.questionId}`}
                      value={answer.id}
                      checked={currentAnswer?.selectedAnswer === answer.id}
                      onChange={(e) => handleAnswer(currentQuestion.questionId, e.target.value, 'single')}
                    />
                    <span>{answer.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="tests_multiple_answers">
                {currentQuestion.answers.map(answer => (
                  <label key={answer.id} className="tests_answer_option">
                    <input
                      type="checkbox"
                      checked={currentAnswer?.selectedAnswers?.includes(answer.id) || false}
                      onChange={(e) => {
                        const current = currentAnswer?.selectedAnswers || [];
                        const newSelection = e.target.checked 
                          ? [...current, answer.id]
                          : current.filter(id => id !== answer.id);
                        handleAnswer(currentQuestion.questionId, newSelection, 'multiple');
                      }}
                    />
                    <span>{answer.text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="tests_text_answer">
                <textarea
                  value={currentAnswer?.textAnswer || ''}
                  onChange={(e) => handleAnswer(currentQuestion.questionId, e.target.value, 'text')}
                  placeholder="Введите ваш ответ..."
                  rows={4}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tests_navigation">
        <button 
          className="tests_nav_btn"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Предыдущий
        </button>
        
        {currentQuestionIndex === test.questions.length - 1 ? (
          <button 
            className="tests_complete_btn"
            onClick={handleCompleteTest}
          >
            Завершить тест
          </button>
        ) : (
          <button 
            className="tests_nav_btn"
            onClick={nextQuestion}
          >
            Следующий
          </button>
        )}
      </div>
    </div>
  );
}

// Компонент результатов теста
function TestResults({ results, isPracticeMode, onBack }) {
  const getGradeColor = (accuracy) => {
    if (accuracy >= 90) return '#28a745';
    if (accuracy >= 70) return '#ffc107';
    if (accuracy >= 50) return '#fd7e14';
    return '#dc3545';
  };

  const getGradeText = (accuracy) => {
    if (accuracy >= 90) return 'Отлично!';
    if (accuracy >= 70) return 'Хорошо';
    if (accuracy >= 50) return 'Удовлетворительно';
    return 'Неудовлетворительно';
  };

  return (
    <div className="tests_results">
      <div className="tests_results_header">
        <h2 className="tests_results_title">
          {isPracticeMode ? 'Результаты тренировки' : 'Результаты теста'}
        </h2>
        <h3 className="tests_test_name">{results.testTitle}</h3>
        {isPracticeMode && (
          <p className="tests_practice_mode_notice">
            ⚠️ Режим тренировки - результаты не засчитаны
          </p>
        )}
      </div>

      <div className="tests_results_content">
        <div className="tests_results_stats">
          <div className="tests_stat_card">
            <div className="tests_stat_icon">📊</div>
            <div className="tests_stat_info">
              <div className="tests_stat_value">{results.totalPoints} / {results.maxPoints}</div>
              <div className="tests_stat_label">Баллов набрано</div>
            </div>
          </div>

          <div className="tests_stat_card">
            <div className="tests_stat_icon">🎯</div>
            <div className="tests_stat_info">
              <div className="tests_stat_value" style={{ color: getGradeColor(results.accuracy) }}>
                {results.accuracy}%
              </div>
              <div className="tests_stat_label">Точность</div>
            </div>
          </div>

          <div className="tests_stat_card">
            <div className="tests_stat_icon">✅</div>
            <div className="tests_stat_info">
              <div className="tests_stat_value">{results.correctAnswers} / {results.totalQuestions}</div>
              <div className="tests_stat_label">Правильных ответов</div>
            </div>
          </div>

          <div className="tests_stat_card">
            <div className="tests_stat_icon">⏱️</div>
            <div className="tests_stat_info">
              <div className="tests_stat_value">{results.timeSpentMinutes} мин</div>
              <div className="tests_stat_label">Время выполнения</div>
            </div>
          </div>
        </div>

        <div className="tests_results_grade">
          <div 
            className="tests_grade_text"
            style={{ color: getGradeColor(results.accuracy) }}
          >
            {getGradeText(results.accuracy)}
          </div>
          <div className="tests_grade_description">
            {results.accuracy >= 90 
              ? 'Превосходная работа! Вы отлично справились с тестом.'
              : results.accuracy >= 70
              ? 'Хорошая работа! Есть небольшие недочеты, но в целом результат неплохой.'
              : results.accuracy >= 50
              ? 'Неплохо, но есть над чем поработать. Рекомендуем повторить материал.'
              : 'Рекомендуем внимательно изучить материал и попробовать снова.'
            }
          </div>
        </div>

        <div className="tests_results_actions">
          <button className="tests_back_to_tests_btn" onClick={onBack}>
            Вернуться к списку тестов
          </button>
        </div>
      </div>
    </div>
  );
}