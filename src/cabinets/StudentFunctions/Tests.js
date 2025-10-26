import { useState, useEffect } from 'react';
import './Tests.css';
import { API_EXAM_URL } from '../../Config';

export default function Tests({ onBack }) {
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
  const [testReview, setTestReview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'upcoming', 'completed', 'missed'
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showDirections, setShowDirections] = useState(true);

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

  // Автоматически выбираем первое направление при загрузке
  useEffect(() => {
    if (directions.length > 0 && !selectedDirection) {
      const firstDirection = directions[0];
      setSelectedDirection(firstDirection);
      setShowDirections(false);
      loadTests(firstDirection);
    }
  }, [directions, selectedDirection]);


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
      const directionName = typeof direction === 'string' ? direction : direction.name;
      const response = await fetch(`${API_EXAM_URL}/tests/${encodeURIComponent(directionName)}`);
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
      
      // Проверяем, не завершен ли уже тест
      if (session.isCompleted) {
        setError('Этот тест уже был завершен. Повторное прохождение не разрешено.');
        localStorage.removeItem('testSession');
        return;
      }
      
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

  const loadTestReview = async (testId, sessionId) => {
    try {
      setLoading(true);
      
      // Загружаем тест
      const testResponse = await fetch(`${API_EXAM_URL}/test/${testId}`);
      if (!testResponse.ok) throw new Error('Тест не найден');
      const testData = await testResponse.json();
      
      // Загружаем статистику с ответами
      const statsResponse = await fetch(`${API_EXAM_URL}/test-session/${sessionId}/stats`);
      if (!statsResponse.ok) throw new Error('Статистика не найдена');
      const statsData = await statsResponse.json();
      
      setTestReview({
        test: testData,
        stats: statsData
      });
    } catch (err) {
      setError('Не удалось загрузить разбор теста: ' + err.message);
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
      
      // Перемешиваем вопросы в случайном порядке (Fisher-Yates алгоритм)
      const shuffledQuestions = [...testData.questions];
      for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      }
      
      const shuffledTestData = {
        ...testData,
        questions: shuffledQuestions
      };
      
      setCurrentTest(shuffledTestData);
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
    setTestReview(null);
    setIsPracticeMode(false);
    setError(null); // Очищаем ошибки
    setCurrentPage(1);
    setFilter('all');
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setShowDirections(false);
    localStorage.removeItem('testSession');
    
    // Обновляем список сданных тестов
    await loadCompletedTests();
  };

  const goBackToTests = async () => {
    setCurrentTest(null);
    setTestSession(null);
    setIsPracticeMode(false);
    setError(null); // Очищаем ошибки
    setShowDirections(false);
    localStorage.removeItem('testSession');
    
    // Обновляем список сданных тестов
    await loadCompletedTests();
  };

  const goBackToDirections = () => {
    setSelectedDirection(null);
    setTests([]);
    setCurrentTest(null);
    setTestSession(null);
    setShowDirections(true);
    localStorage.removeItem('testSession');
  };

  // Если есть разбор теста, показываем его
  if (testReview) {
    return (
      <TestReview 
        test={testReview.test}
        stats={testReview.stats}
        onBack={resetTest}
      />
    );
  }

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

  // Показываем объединенное окно с направлениями и тестами
  return (
    <div className="tests_tests">
      <div className="tests_header">
        <h2 className="tests_title">Тесты</h2>
      </div>

      {/* Табы направлений */}
      <div className="tests_directions_tabs">
        {directions.map(direction => (
          <button
            key={direction.id}
            className={`tests_direction_tab ${selectedDirection?.id === direction.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedDirection(direction);
              setShowDirections(false);
              setCurrentPage(1);
              setFilter('all');
              setSearchTerm('');
              setDateFilter({ startDate: '', endDate: '' });
              loadTests(direction);
            }}
          >
            {direction.name}
          </button>
        ))}
      </div>

      {/* Контент тестов */}
      {selectedDirection && (
        <TestsList 
          direction={selectedDirection}
          tests={tests}
          completedTests={completedTests}
          testStats={testStats}
          loading={loading}
          error={error}
          onStartTest={startTest}
          onStartPractice={(testId) => startTest(testId, true)}
          onViewResults={loadTestReview}
          onBack={goBackToTests}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      )}
    </div>
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
    return (
      <div className="student-section">
        <div className="loading">
          <div className="loading-spinner"></div>
          Загрузка направлений...
        </div>
      </div>
    );
  }

  return (
    <div className="tests_directions">
      <div className="tests_header">
        <h2 className="tests_title">Выберите направление</h2>
      </div>
      
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
function TestsList({ 
  direction, tests, completedTests, testStats, loading, error, 
  onStartTest, onStartPractice, onViewResults, onBack,
  currentPage, setCurrentPage, filter, setFilter, searchTerm, setSearchTerm,
  dateFilter, setDateFilter
}) {
  if (error) {
    return (
      <div className="student-section">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3 className="empty-title">Ошибка загрузки</h3>
          <p className="empty-text">{error}</p>
          <button className="btn btn-primary" onClick={onBack}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="student-section">
        <div className="loading">
          <div className="loading-spinner"></div>
          Загрузка тестов...
        </div>
      </div>
    );
  }

  // Группировка тестов
  const groupTests = (tests) => {
    const now = new Date();
    const available = [];
    const upcoming = [];
    const completed = [];
    const missed = [];
    
    tests.forEach(test => {
      const startDate = new Date(test.startDate);
      const endDate = new Date(test.endDate);
      const isCompleted = completedTests.some(completed => completed.testId === test.id);
      
      if (isCompleted) {
        completed.push(test);
      } else if (now >= startDate && now <= endDate) {
        available.push(test);
      } else if (now < startDate) {
        upcoming.push(test);
      } else if (now > endDate) {
        // Тест уже закончился, но не был сдан - пропущен
        missed.push(test);
      }
    });
    
    return { available, upcoming, completed, missed };
  };

  // Фильтрация тестов
  const filterTests = (tests, searchTerm) => {
    if (!searchTerm) return tests;
    return tests.filter(test => 
      test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Фильтрация по датам
  const filterTestsByDate = (tests, dateFilter) => {
    if (!dateFilter.startDate && !dateFilter.endDate) return tests;
    
    return tests.filter(test => {
      const testStartDate = new Date(test.startDate);
      const testEndDate = new Date(test.endDate);
      
      let matchesStart = true;
      let matchesEnd = true;
      
      if (dateFilter.startDate) {
        const filterStartDate = new Date(dateFilter.startDate);
        matchesStart = testStartDate >= filterStartDate;
      }
      
      if (dateFilter.endDate) {
        const filterEndDate = new Date(dateFilter.endDate);
        matchesEnd = testEndDate <= filterEndDate;
      }
      
      return matchesStart && matchesEnd;
    });
  };

  // Пагинация
  const paginateTests = (tests, page, itemsPerPage = 4) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tests.slice(startIndex, endIndex);
  };

  const isTestCompleted = (test) => {
    return completedTests.some(completed => completed.testId === test.id);
  };

  const getTestResult = (test) => {
    const completedTest = completedTests.find(completed => completed.testId === test.id);
    const stats = testStats[test.id];
    return { ...completedTest, stats };
  };

  const groupedTests = groupTests(tests);
  
  // Применяем все фильтры
  const filteredAvailable = filterTestsByDate(
    filterTests(groupedTests.available, searchTerm), 
    dateFilter
  );
  const filteredUpcoming = filterTestsByDate(
    filterTests(groupedTests.upcoming, searchTerm), 
    dateFilter
  );
  const filteredCompleted = filterTestsByDate(
    filterTests(groupedTests.completed, searchTerm), 
    dateFilter
  );
  const filteredMissed = filterTestsByDate(
    filterTests(groupedTests.missed, searchTerm), 
    dateFilter
  );

  // Определяем какие тесты показывать в зависимости от фильтра
  let testsToShow = [];
  if (filter === 'available') testsToShow = filteredAvailable;
  else if (filter === 'upcoming') testsToShow = filteredUpcoming;
  else if (filter === 'completed') testsToShow = filteredCompleted;
  else if (filter === 'missed') testsToShow = filteredMissed;
  else testsToShow = [...filteredAvailable, ...filteredUpcoming, ...filteredCompleted, ...filteredMissed];

  const paginatedTests = paginateTests(testsToShow, currentPage);
  const totalPages = Math.ceil(testsToShow.length / 4);

  const TestCard = ({ test, type }) => {
    const completed = isTestCompleted(test);
    const testResult = getTestResult(test);
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    const available = now >= startDate && now <= endDate;

    return (
      <div key={test.id} className={`tests_test_card ${completed ? 'completed' : ''} ${type}`}>
        <div className="tests_test_card_header">
          <h3 className="tests_test_title">{test.title}</h3>
          <div className={`tests_test_type_badge ${type}`}>
            {type === 'available' && 'Доступен'}
            {type === 'upcoming' && 'Скоро'}
            {type === 'completed' && 'Сдан'}
            {type === 'missed' && 'Пропущен'}
          </div>
        </div>
        
        <div className="tests_test_info">
          <p><strong>Время выполнения:</strong> {test.timeLimitMinutes} минут</p>
          <p><strong>Период проведения:</strong></p>
          <p>{new Date(test.startDate).toLocaleDateString()} - {new Date(test.endDate).toLocaleDateString()}</p>
          
          {completed && testResult ? (
            <div className="tests_test_completed_info">
              <p><strong>Рейтинговый балл:</strong> {parseInt(testResult.score) || 0} из 100</p>
              {testResult.stats ? (
                <>
                  <p><strong>Правильных ответов:</strong> {testResult.stats.correctAnswers || 0} из {testResult.stats.totalQuestions || 0}</p>
                  <p><strong>Точность:</strong> {testResult.stats.accuracy || 0}%</p>
                </>
              ) : (
                <p><em>Загрузка статистики...</em></p>
              )}
              <p><strong>Время выполнения:</strong> {testResult.timeSpentMinutes || 0} мин</p>
            </div>
          ) : type === 'upcoming' ? (
            <p className="tests_test_status upcoming">Начнется {new Date(test.startDate).toLocaleDateString()}</p>
          ) : type === 'missed' ? (
            <p className="tests_test_status missed">Пропущен - закончился {new Date(test.endDate).toLocaleDateString()}</p>
          ) : (
            <p className={`tests_test_status ${available ? 'available' : 'unavailable'}`}>
              {available ? 'Доступен' : 'Недоступен'}
            </p>
          )}
        </div>
        
        <div className="tests_test_actions">
          {!completed && available && (
            <button 
              className="tests_start_btn enabled"
              onClick={() => onStartTest(test.id)}
            >
              Начать тест
            </button>
          )}
          
          {completed && (
            <>
              <button 
                className="tests_view_results_btn"
                onClick={() => onViewResults(test.id, testResult.id)}
              >
                Посмотреть результаты
              </button>
              <button 
                className="tests_practice_btn"
                onClick={() => onStartPractice(test.id)}
              >
                Потренироваться
              </button>
            </>
          )}
          
          {type === 'upcoming' && (
            <button className="tests_start_btn disabled" disabled>
              Скоро будет доступен
            </button>
          )}
          
          {type === 'missed' && (
            <button className="tests_start_btn disabled" disabled>
              Пропущен - больше недоступен
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="tests_tests_content">

      {/* Фильтры и поиск */}
      <div className="tests_filters">
        <div className="tests_search">
          <input
            type="text"
            placeholder="Поиск тестов..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="tests_search_input"
          />
        </div>
        
        <div className="tests_date_filters">
          <div className="tests_date_filter_group">
            <label className="tests_date_label">С даты:</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => { 
                setDateFilter({...dateFilter, startDate: e.target.value}); 
                setCurrentPage(1); 
              }}
              className="tests_date_input"
            />
          </div>
          
          <div className="tests_date_filter_group">
            <label className="tests_date_label">По дату:</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => { 
                setDateFilter({...dateFilter, endDate: e.target.value}); 
                setCurrentPage(1); 
              }}
              className="tests_date_input"
            />
          </div>
          
          <button 
            className="tests_clear_filters_btn"
            onClick={() => { 
              setDateFilter({ startDate: '', endDate: '' }); 
              setCurrentPage(1); 
            }}
            disabled={!dateFilter.startDate && !dateFilter.endDate}
          >
            Очистить даты
          </button>
        </div>
        
        <div className="tests_filter_buttons">
          <button 
            className={`tests_filter_btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
          >
            Все ({tests.length})
          </button>
          <button 
            className={`tests_filter_btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => { setFilter('available'); setCurrentPage(1); }}
          >
            Доступные ({filteredAvailable.length})
          </button>
          <button 
            className={`tests_filter_btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => { setFilter('upcoming'); setCurrentPage(1); }}
          >
            Скоро ({filteredUpcoming.length})
          </button>
          <button 
            className={`tests_filter_btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => { setFilter('completed'); setCurrentPage(1); }}
          >
            Сданные ({filteredCompleted.length})
          </button>
          <button 
            className={`tests_filter_btn ${filter === 'missed' ? 'active' : ''}`}
            onClick={() => { setFilter('missed'); setCurrentPage(1); }}
          >
            Пропущенные ({filteredMissed.length})
          </button>
        </div>
      </div>

      {/* Список тестов */}
      <div className="tests_tests_list">
        {paginatedTests.length === 0 ? (
          <p className="tests_no_tests">Тесты не найдены</p>
        ) : (
          paginatedTests.map(test => {
            const completed = isTestCompleted(test);
            const now = new Date();
            const startDate = new Date(test.startDate);
            const endDate = new Date(test.endDate);
            const available = now >= startDate && now <= endDate;
            
            let type = 'available';
            if (completed) type = 'completed';
            else if (now < startDate) type = 'upcoming';
            else if (now > endDate) type = 'missed';
            
            return <TestCard key={test.id} test={test} type={type} />;
          })
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="tests_pagination">
          <button 
            className="tests_pagination_btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Предыдущая
          </button>
          
          <div className="tests_pagination_pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`tests_pagination_page ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            className="tests_pagination_btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Следующая →
          </button>
        </div>
      )}
    </div>
  );
}

// Компонент прохождения теста
function TestComponent({ test, session, onComplete, onBack, getStudentId, isPracticeMode }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.currentQuestionIndex);
  const [answers, setAnswers] = useState(session.answers || []);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCopyWarning, setShowCopyWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

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
        setIsTimeUp(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [session, isCompleted]);

  // Функция для обработки попыток копирования
  const handleCopyAttempt = (e) => {
    e.preventDefault();
    setShowCopyWarning(true);
    setTimeout(() => setShowCopyWarning(false), 3000);
  };

  // Функция для обработки выделения текста
  const handleTextSelection = (e) => {
    e.preventDefault();
    setShowCopyWarning(true);
    setTimeout(() => setShowCopyWarning(false), 3000);
  };

  const handleAnswer = (questionId, answer, questionType) => {
    console.log('handleAnswer вызвана:', { questionId, answer, questionType });
    console.log('Текущие ответы до обновления:', answers);
    
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
      console.log('Обновлен существующий ответ:', existingAnswerIndex);
    } else {
      newAnswers.push(answerData);
      console.log('Добавлен новый ответ');
    }

    console.log('Новые ответы после обновления:', newAnswers);
    setAnswers(newAnswers);
    
    // Сохраняем в localStorage
    const updatedSession = {
      ...session,
      currentQuestionIndex,
      answers: newAnswers
    };
    localStorage.setItem('testSession', JSON.stringify(updatedSession));
    console.log('Ответы сохранены в localStorage');
  };

  // Проверка, есть ли ответ на текущий вопрос
  const hasAnswerForCurrentQuestion = () => {
    const currentQuestion = test.questions[currentQuestionIndex];
    const existingAnswer = answers.find(answer => answer.questionId === currentQuestion.questionId);
    
    if (!existingAnswer) return false;
    
    if (currentQuestion.type === 'single') {
      return existingAnswer.selectedAnswer !== null && existingAnswer.selectedAnswer !== undefined;
    } else if (currentQuestion.type === 'multiple') {
      return existingAnswer.selectedAnswers && existingAnswer.selectedAnswers.length > 0;
    } else if (currentQuestion.type === 'text') {
      return existingAnswer.textAnswer && existingAnswer.textAnswer.trim() !== '';
    }
    
    return false;
  };

  const nextQuestion = () => {
    // Проверяем, есть ли ответ на текущий вопрос
    if (!hasAnswerForCurrentQuestion()) {
      setSubmitError('Пожалуйста, выберите ответ на текущий вопрос перед переходом к следующему.');
      return;
    }
    
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

  // Автоматическое завершение теста по истечении времени (без проверки обязательности ответа)
  const handleAutoCompleteTest = async () => {
    if (isCompleted || isSubmitting) return;
    
    console.log('Автоматическое завершение теста по истечении времени');
    
    // Принудительно обновляем localStorage с текущими ответами перед завершением
    console.log('ПЕРЕД принудительным обновлением - ответы из React:', answers);
    console.log('ПЕРЕД принудительным обновлением - session:', session);
    
    const updatedSession = {
      ...session,
      answers: answers
    };
    localStorage.setItem('testSession', JSON.stringify(updatedSession));
    console.log('Принудительно обновлен localStorage с ответами:', answers.length);
    console.log('Принудительно обновлен localStorage - ответы:', answers);
    
    // ВСЕГДА берем ответы из localStorage - это источник истины
    const savedSession = localStorage.getItem('testSession');
    let finalAnswers = [];
    
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        finalAnswers = parsedSession.answers || [];
        console.log('Загружены ответы из localStorage:', finalAnswers.length);
        console.log('Ответы из localStorage:', finalAnswers);
        console.log('ПОСЛЕ загрузки из localStorage - finalAnswers:', finalAnswers);
      } catch (error) {
        console.error('Ошибка загрузки сессии из localStorage:', error);
        // Если ошибка, берем из состояния React как fallback
        finalAnswers = [...answers];
        console.log('Fallback - ответы из состояния React:', finalAnswers.length);
        console.log('Fallback - ответы из состояния React:', finalAnswers);
      }
    } else {
      // Если нет localStorage, берем из состояния React
      finalAnswers = [...answers];
      console.log('Нет localStorage - ответы из состояния React:', finalAnswers.length);
      console.log('Нет localStorage - ответы из состояния React:', finalAnswers);
    }
    
    // Устанавливаем флаг отправки ПОСЛЕ загрузки ответов
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Убеждаемся, что у нас есть ответы для всех вопросов (даже пустые)
    const allQuestionIds = test.questions.map(q => q.questionId);
    const answeredQuestionIds = finalAnswers.map(a => a.questionId);
    
    // Добавляем пустые ответы для вопросов, на которые не отвечали
    allQuestionIds.forEach(questionId => {
      if (!answeredQuestionIds.includes(questionId)) {
        const question = test.questions.find(q => q.questionId === questionId);
        const emptyAnswer = {
          questionId: questionId,
          type: question.type,
          selectedAnswer: null,
          selectedAnswers: [],
          textAnswer: '',
          points: 0,
          isCorrect: false
        };
        finalAnswers.push(emptyAnswer);
      }
    });
    
    console.log('Финальные ответы для отправки:', finalAnswers.length);
    console.log('Всего вопросов в тесте:', test.questions.length);
    console.log('Детали ответов:', finalAnswers.map(a => ({
      questionId: a.questionId,
      type: a.type,
      selectedAnswer: a.selectedAnswer,
      selectedAnswers: a.selectedAnswers,
      textAnswer: a.textAnswer,
      points: a.points,
      isCorrect: a.isCorrect
    })));
    
    // Рассчитываем баллы на клиенте
    const calculatedAnswers = finalAnswers.map(answer => {
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
        const incorrectAnswers = question.answers.filter(a => !a.isCorrect).map(a => a.id);
        const selectedAnswers = answer.selectedAnswers || [];
        
        // СТРОГАЯ ПРОВЕРКА для множественного выбора:
        // 1. Выбраны ВСЕ правильные ответы (ни одного не пропущено)
        // 2. НЕ выбраны НИ ОДИН неправильный ответ
        // 3. Количество выбранных ответов равно количеству правильных
        // Если хотя бы одно условие не выполнено - 0 баллов
        const allCorrectSelected = correctAnswers.length === selectedAnswers.length && 
                                  correctAnswers.every(id => selectedAnswers.includes(id));
        const noIncorrectSelected = !selectedAnswers.some(id => incorrectAnswers.includes(id));
        
        isCorrect = allCorrectSelected && noIncorrectSelected;
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
    const totalPoints = calculatedAnswers.reduce((sum, answer) => sum + parseInt(answer.points), 0);
    const maxPoints = test.questions.reduce((sum, question) => sum + parseInt(question.points), 0);
    const correctAnswers = calculatedAnswers.filter(answer => answer.isCorrect).length;
    const accuracy = test.questions.length > 0 ? Math.round((correctAnswers / test.questions.length) * 100) : 0;
    const timeSpentMinutes = Math.ceil((Date.now() - session.startTime) / (1000 * 60));
    
    // Рассчитываем рейтинговый балл (процент от максимального балла, выраженный в баллах от 0 до 100)
    const ratingScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    const results = {
      testTitle: test.title,
      totalPoints: parseInt(totalPoints),
      maxPoints: parseInt(maxPoints),
      ratingScore: ratingScore,
      correctAnswers,
      totalQuestions: test.questions.length,
      accuracy,
      timeSpentMinutes,
      answers: calculatedAnswers,
      autoCompleted: true // Флаг автоматического завершения
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
          timeSpentMinutes: timeSpentMinutes,
          score: ratingScore
        })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Тест автоматически завершен, ID сессии:', result.id);
          setIsCompleted(true);
          
          // Обновляем сессию в localStorage как завершенную
          const updatedSession = { ...session, isCompleted: true };
          localStorage.setItem('testSession', JSON.stringify(updatedSession));
          
          onComplete(results);
        } else if (response.status === 409) {
          // Обработка ошибки дублирования (тест уже сдан)
          const errorData = await response.json();
          console.warn('Тест уже сдан:', errorData);
          setSubmitError(`Тест уже был сдан ранее. Результат: ${errorData.existingScore || 'неизвестно'} баллов`);
          setIsCompleted(true);
          
          // Обновляем сессию в localStorage как завершенную
          const updatedSession = { ...session, isCompleted: true };
          localStorage.setItem('testSession', JSON.stringify(updatedSession));
          
          onComplete(results);
        } else {
          const errorText = await response.text();
          throw new Error(`Ошибка сервера (${response.status}): ${errorText}`);
        }
      } catch (error) {
        console.error('Ошибка отправки результатов:', error);
        
        // Различаем типы ошибок
        if (error.message.includes('409')) {
          setSubmitError('Тест уже был сдан ранее. Повторная отправка невозможна.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setSubmitError('Ошибка сети. Проверьте подключение к интернету и попробуйте еще раз.');
        } else {
          setSubmitError('Не удалось отправить результаты. Попробуйте еще раз.');
        }
        
        setIsSubmitting(false);
        return;
      }
    } else {
      console.log('Режим тренировки - результаты не отправлены на сервер');
      setIsCompleted(true);
      onComplete(results);
    }

    // Очищаем localStorage только при успешном завершении
    if (isCompleted) {
      localStorage.removeItem('testSession');
    }
  };

  const handleCompleteTest = async () => {
    if (isCompleted || isSubmitting) return;
    
    // Проверяем, есть ли ответ на текущий вопрос (только если время НЕ истекло)
    if (!isTimeUp && !hasAnswerForCurrentQuestion()) {
      setSubmitError('Пожалуйста, выберите ответ на текущий вопрос перед завершением теста.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Дополнительная защита от повторных вызовов
    if (isCompleted || isSubmitting) return;
    
    // Рассчитываем баллы на клиенте
    // ВСЕГДА берем ответы из localStorage - это источник истины
    const savedSession = localStorage.getItem('testSession');
    let currentAnswers = answers;
    
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        currentAnswers = parsedSession.answers || [];
        console.log('Обычное завершение - загружены ответы из localStorage:', currentAnswers.length);
        console.log('Ответы из localStorage:', currentAnswers);
      } catch (error) {
        console.error('Ошибка загрузки сессии из localStorage:', error);
      }
    }
    
    const calculatedAnswers = currentAnswers.map(answer => {
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
        const incorrectAnswers = question.answers.filter(a => !a.isCorrect).map(a => a.id);
        const selectedAnswers = answer.selectedAnswers || [];
        
        // СТРОГАЯ ПРОВЕРКА для множественного выбора:
        // 1. Выбраны ВСЕ правильные ответы (ни одного не пропущено)
        // 2. НЕ выбраны НИ ОДИН неправильный ответ
        // 3. Количество выбранных ответов равно количеству правильных
        // Если хотя бы одно условие не выполнено - 0 баллов
        const allCorrectSelected = correctAnswers.length === selectedAnswers.length && 
                                  correctAnswers.every(id => selectedAnswers.includes(id));
        const noIncorrectSelected = !selectedAnswers.some(id => incorrectAnswers.includes(id));
        
        isCorrect = allCorrectSelected && noIncorrectSelected;
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
    const totalPoints = calculatedAnswers.reduce((sum, answer) => sum + parseInt(answer.points), 0);
    const maxPoints = test.questions.reduce((sum, question) => sum + parseInt(question.points), 0);
    const correctAnswers = calculatedAnswers.filter(answer => answer.isCorrect).length;
    const accuracy = test.questions.length > 0 ? Math.round((correctAnswers / test.questions.length) * 100) : 0;
    const timeSpentMinutes = Math.ceil((Date.now() - session.startTime) / (1000 * 60));
    
    // Рассчитываем рейтинговый балл (процент от максимального балла, выраженный в баллах от 0 до 100)
    const ratingScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

    const results = {
      testTitle: test.title,
      totalPoints: parseInt(totalPoints),
      maxPoints: parseInt(maxPoints),
      ratingScore: ratingScore, // Новое поле - рейтинговый балл
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
          timeSpentMinutes: timeSpentMinutes,
          score: ratingScore // Отправляем рейтинговый балл вместо обычного score
        })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Тест завершен, ID сессии:', result.id);
          setIsCompleted(true);
          
          // Обновляем сессию в localStorage как завершенную
          const updatedSession = { ...session, isCompleted: true };
          localStorage.setItem('testSession', JSON.stringify(updatedSession));
          
          onComplete(results);
        } else if (response.status === 409) {
          // Обработка ошибки дублирования (тест уже сдан)
          const errorData = await response.json();
          console.warn('Тест уже сдан:', errorData);
          setSubmitError(`Тест уже был сдан ранее. Результат: ${errorData.existingScore || 'неизвестно'} баллов`);
          setIsCompleted(true); // Помечаем как завершенный, чтобы показать результаты
          
          // Обновляем сессию в localStorage как завершенную
          const updatedSession = { ...session, isCompleted: true };
          localStorage.setItem('testSession', JSON.stringify(updatedSession));
          
          onComplete(results); // Показываем результаты локально
        } else {
          const errorText = await response.text();
          throw new Error(`Ошибка сервера (${response.status}): ${errorText}`);
        }
      } catch (error) {
        console.error('Ошибка отправки результатов:', error);
        
        // Различаем типы ошибок
        if (error.message.includes('409')) {
          setSubmitError('Тест уже был сдан ранее. Повторная отправка невозможна.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setSubmitError('Ошибка сети. Проверьте подключение к интернету и попробуйте еще раз.');
        } else {
          setSubmitError('Не удалось отправить результаты. Попробуйте еще раз.');
        }
        
        setIsSubmitting(false);
        return; // Не завершаем тест при ошибке
      }
    } else {
      console.log('Режим тренировки - результаты не отправлены на сервер');
      setIsCompleted(true);
      onComplete(results);
    }

    // Очищаем localStorage только при успешном завершении
    if (isCompleted) {
      localStorage.removeItem('testSession');
    }
  };

  // Функция для повторной попытки отправки
  const retrySubmission = () => {
    setSubmitError(null);
    handleCompleteTest();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.questionId);
  
  console.log('=== ОТЛАДКА КОМПОНЕНТА ТЕСТА ===');
  console.log('Текущий вопрос:', currentQuestionIndex, currentQuestion?.questionId);
  console.log('Всего ответов в массиве:', answers.length);
  console.log('Текущий ответ:', currentAnswer);
  console.log('Все ответы:', answers);

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
          <h3 
            className="tests_question_text"
            onCopy={handleCopyAttempt}
            onSelectStart={handleTextSelection}
            onContextMenu={handleCopyAttempt}
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
          >
            {currentQuestion.text}
          </h3>
          <p className="tests_question_points">Баллов: {parseInt(currentQuestion.points)}</p>
          
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
        {currentQuestionIndex === test.questions.length - 1 ? (
          <div className="tests_complete_section">
            <button
              className={`tests_complete_btn ${!isTimeUp && !hasAnswerForCurrentQuestion() ? 'tests_nav_btn_disabled' : ''}`}
              onClick={handleCompleteTest}
              disabled={isSubmitting || isCompleted || (!isTimeUp && !hasAnswerForCurrentQuestion())}
            >
              {isSubmitting ? (
                <>
                  <span className="tests_loading_spinner"></span>
                  Отправка...
                </>
              ) : isCompleted ? (
                'Тест завершен'
              ) : !isTimeUp && !hasAnswerForCurrentQuestion() ? (
                'Выберите ответ'
              ) : (
                'Завершить тест'
              )}
            </button>
            {submitError && (
              <div className="tests_submit_error">
                <p>{submitError}</p>
                <button 
                  className="tests_retry_btn"
                  onClick={retrySubmission}
                >
                  Попробовать еще раз
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            className={`tests_nav_btn ${!hasAnswerForCurrentQuestion() ? 'tests_nav_btn_disabled' : ''}`}
            onClick={nextQuestion}
            disabled={!hasAnswerForCurrentQuestion()}
          >
            {hasAnswerForCurrentQuestion() ? 'Следующий' : 'Выберите ответ'}
          </button>
        )}
      </div>

      {/* Предупреждение о копировании */}
      {showCopyWarning && (
        <div className="tests_copy_warning">
          <div className="tests_copy_warning_content">
            <span className="tests_copy_warning_icon">⚠️</span>
            <p>Копирование текста вопросов запрещено!</p>
          </div>
        </div>
      )}
      
      {/* Модальное окно "Время вышло" */}
      {isTimeUp && (
        <div className="tests_timeup_modal">
          <div className="tests_timeup_modal_content">
            <h2>⏰ Время вышло!</h2>
            <p>Время на прохождение теста истекло.</p>
            <p>Нажмите "Завершить тест" чтобы отправить ваши ответы.</p>
            <div className="tests_timeup_modal_buttons">
              <button 
                className="tests_timeup_btn tests_timeup_btn_primary"
                onClick={handleCompleteTest}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Отправка...' : 'Завершить тест'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент результатов теста
function TestResults({ results, isPracticeMode, onBack }) {
  const getGradeColor = (ratingScore) => {
    if (ratingScore >= 90) return '#28a745';
    if (ratingScore >= 70) return '#ffc107';
    if (ratingScore >= 50) return '#fd7e14';
    return '#dc3545';
  };

  const getGradeText = (ratingScore) => {
    if (ratingScore >= 90) return 'Отлично!';
    if (ratingScore >= 70) return 'Хорошо';
    if (ratingScore >= 50) return 'Удовлетворительно';
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
        {results.autoCompleted && (
          <p className="tests_auto_completed_notice">
            ⏰ Тест автоматически завершен по истечении времени
          </p>
        )}
      </div>

      <div className="tests_results_content">
        <div className="tests_results_stats">
          <div className="tests_stat_card">
            <div className="tests_stat_icon">📊</div>
            <div className="tests_stat_info">
              <div className="tests_stat_value">{parseInt(results.ratingScore)} / 100</div>
              <div className="tests_stat_label">Рейтинговый балл</div>
            </div>
          </div>

          <div className="tests_stat_card">
            <div className="tests_stat_icon">🎯</div>
            <div className="tests_stat_info">
              <div className="tests_stat_value" style={{ color: getGradeColor(results.ratingScore) }}>
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
            style={{ color: getGradeColor(results.ratingScore) }}
          >
            {getGradeText(results.ratingScore)}
          </div>
          <div className="tests_grade_description">
            {results.ratingScore >= 90 
              ? 'Превосходная работа! Вы отлично справились с тестом.'
              : results.ratingScore >= 70
              ? 'Хорошая работа! Есть небольшие недочеты, но в целом результат неплохой.'
              : results.ratingScore >= 50
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

// Компонент разбора теста
function TestReview({ test, stats, onBack }) {
  const getAnswerText = (question, answer) => {
    // Проверяем, что answer существует
    if (!answer) {
      return 'Ответ не найден';
    }
    
    if (question.type === 'single') {
      const selectedAnswer = question.answers.find(a => a.id === answer.selectedAnswer);
      return selectedAnswer ? selectedAnswer.text : 'Не выбран ответ';
    } else if (question.type === 'multiple') {
      const selectedAnswers = question.answers.filter(a => answer.selectedAnswers?.includes(a.id));
      return selectedAnswers.length > 0 ? selectedAnswers.map(a => a.text).join(', ') : 'Не выбраны ответы';
    } else if (question.type === 'text') {
      return answer.textAnswer || 'Ответ не дан';
    }
    return 'Неизвестный тип вопроса';
  };

  const getCorrectAnswerText = (question) => {
    if (question.type === 'single') {
      const correctAnswer = question.answers.find(a => a.isCorrect);
      return correctAnswer ? correctAnswer.text : 'Правильный ответ не найден';
    } else if (question.type === 'multiple') {
      const correctAnswers = question.answers.filter(a => a.isCorrect);
      return correctAnswers.length > 0 ? correctAnswers.map(a => a.text).join(', ') : 'Правильные ответы не найдены';
    } else if (question.type === 'text') {
      return question.correctAnswers ? question.correctAnswers.join(', ') : 'Правильный ответ не найден';
    }
    return 'Неизвестный тип вопроса';
  };

  return (
    <div className="tests_review">
      <div className="tests_review_header">
        <button className="tests_back_btn" onClick={onBack}>← Назад</button>
        <h2 className="tests_review_title">Разбор теста: {test.title}</h2>
        <div className="tests_review_summary">
          <span className="tests_review_score">Рейтинговый балл: {stats.totalPoints || 0} из 100</span>
        </div>
      </div>

      <div className="tests_review_content">
        {test.questions.map((question, index) => {
          const answer = stats.answers?.find(a => a.questionId === question.questionId);
          const isCorrect = answer?.isCorrect || false;
          const points = answer?.points || 0;
          
          // Если ответ не найден, создаем пустой объект ответа
          const safeAnswer = answer || {
            questionId: question.questionId,
            type: question.type,
            selectedAnswer: null,
            selectedAnswers: [],
            textAnswer: '',
            points: 0,
            isCorrect: false
          };
          
          return (
            <div key={question.questionId} className="tests_review_question">
              <div className="tests_review_question_header">
                <h3>Вопрос {index + 1}</h3>
                <div className={`tests_review_question_status ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? '✅ Правильно' : '❌ Неправильно'}
                </div>
                <div className="tests_review_question_points">
                  {points} / {question.points} баллов
                </div>
              </div>
              
              <div className="tests_review_question_text">
                {question.text}
              </div>
              
              <div className="tests_review_answers">
                <div className="tests_review_answer_section">
                  <h4>Ваш ответ:</h4>
                  <div className={`tests_review_answer ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {getAnswerText(question, safeAnswer)}
                  </div>
                </div>
                
                <div className="tests_review_answer_section">
                  <h4>Правильный ответ:</h4>
                  <div className="tests_review_correct_answer">
                    {getCorrectAnswerText(question)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}