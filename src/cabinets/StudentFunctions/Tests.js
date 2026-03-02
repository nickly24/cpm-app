import { useState, useEffect } from 'react';
import './Tests.css';
import { API_EXAM_URL } from '../../Config';
import { useAuth } from '../../AuthContext';
import axios from '../../api';

export default function Tests({ onBack }) {
  const { user } = useAuth();
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
  const [testsPagination, setTestsPagination] = useState(null); // { current_page, total_pages, total_items, items_per_page }
  const [filter, setFilter] = useState('all'); // 'all', 'available', 'upcoming', 'completed', 'missed'
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showDirections, setShowDirections] = useState(true);
  const testsPerPage = 6;
  const [serverTimeMoscow, setServerTimeMoscow] = useState(null); // время по Москве с сервера для проверки доступности

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
      setCurrentPage(1);
      loadTests(firstDirection, 1, testsPerPage);
    }
  }, [directions, selectedDirection]);


  const loadDirections = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_EXAM_URL}/directions`);
      setDirections(response.data);
    } catch (err) {
      setError('Не удалось загрузить направления: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStudentId = () => {
    return user?.id;
  };

  const loadTests = async (direction, page = 1, limit = 6) => {
    try {
      setLoading(true);
      const directionName = typeof direction === 'string' ? direction : direction.name;
      // Один запрос: тесты по направлению + все сессии студента + статистика по сессиям
      const url = `${API_EXAM_URL}/tests/${encodeURIComponent(directionName)}/with-sessions`;
      const response = await axios.get(url);
      const data = response.data;
      const list = data.tests || [];
      setTests(list);
      setTestsPagination(null);
      const sessions = data.sessions || [];
      setCompletedTests(sessions);
      setServerTimeMoscow(data.serverTimeMoscow || null);
      const statsMap = {};
      sessions.forEach((s) => {
        if (s.testId != null && s.stats) statsMap[String(s.testId)] = s.stats;
      });
      setTestStats(statsMap);
    } catch (err) {
      setError('Не удалось загрузить тесты: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTestFromSession = async (session) => {
    try {
      setLoading(true);

      if (session.isCompleted) {
        setError('Этот тест уже был завершен. Повторное прохождение не разрешено.');
        localStorage.removeItem('testSession');
        return;
      }

      const response = await axios.get(`${API_EXAM_URL}/test/${session.testId}`);
      const testData = response.data;
      // Восстанавливаем порядок вопросов, как был при старте сессии
      if (session.questionOrder && session.questionOrder.length && testData.questions) {
        const orderMap = new Map(session.questionOrder.map((id, i) => [id, i]));
        testData.questions = [...testData.questions].sort((a, b) => {
          const ai = orderMap.get(a.questionId) ?? 9999;
          const bi = orderMap.get(b.questionId) ?? 9999;
          return ai - bi;
        });
      }
      setCurrentTest(testData);
      setTestSession(session);
      setIsPracticeMode(!!session.isPracticeMode);
    } catch (err) {
      setError('Не удалось восстановить тест: ' + err.message);
      localStorage.removeItem('testSession');
    } finally {
      setLoading(false);
    }
  };

  const loadTestReview = async (testId, sessionId) => {
    // Проверяем, не является ли это внешним тестом
    const test = tests.find(t => t.id === testId || t._id === testId);
    if (test && (test.isExternal || test.externalTest)) {
      setError('Просмотр ответов недоступен для тестов, проведенных вне платформы CPM-LMS.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Загружаем тест
      const testResponse = await axios.get(`${API_EXAM_URL}/test/${testId}`);
      
      // Дополнительная проверка - если тест не найден, это может быть внешний тест
      if (!testResponse.data || !testResponse.data.questions) {
        setError('Просмотр ответов недоступен для этого теста.');
        return;
      }
      
      // Загружаем статистику с ответами
      const statsResponse = await axios.get(`${API_EXAM_URL}/test-session/${sessionId}/stats`);
      
      setTestReview({
        test: testResponse.data,
        stats: statsResponse.data
      });
    } catch (err) {
      setError('Не удалось загрузить разбор теста: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testId, practiceMode = false) => {
    const test = tests.find(t => t.id === testId || t._id === testId);
    if (test && (test.isExternal || test.externalTest)) {
      setError('Этот тест проводился вне платформы CPM-LMS и недоступен для прохождения.');
      return;
    }

    const isAlreadyCompleted = completedTests.some(c => String(c.testId) === String(testId));
    if (isAlreadyCompleted && !practiceMode) {
      setError('Этот тест уже сдан. Повторное прохождение не разрешено.');
      return;
    }

    // Восстановление активной сессии из localStorage (тот же тест, время не истекло)
    try {
      const saved = localStorage.getItem('testSession');
      if (saved && !practiceMode) {
        const parsed = JSON.parse(saved);
        const endTime = (parsed.startTime || 0) + (parsed.timeLimit || 0);
        if (String(parsed.testId) === String(testId) && endTime > Date.now()) {
          setLoading(true);
          await loadTestFromSession(parsed);
          return;
        }
      }
    } catch (_) {}

    try {
      setLoading(true);
      const response = await axios.get(`${API_EXAM_URL}/test/${testId}`);
      const testData = response.data;
      
      // Дополнительная проверка - если тест не найден в MongoDB, это может быть внешний тест
      if (!testData || !testData.questions) {
        setError('Этот тест недоступен для прохождения.');
        return;
      }
      
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
      
      const newSession = {
        testId: testId,
        testTitle: testData.title,
        startTime: Date.now(),
        timeLimit: testData.timeLimitMinutes * 60 * 1000,
        currentQuestionIndex: 0,
        answers: [],
        questionOrder: shuffledQuestions.map(q => q.questionId),
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
    
    // Обновляем список тестов и сессий одним запросом
    if (selectedDirection) await loadTests(selectedDirection);
  };

  const goBackToTests = async () => {
    setCurrentTest(null);
    setTestSession(null);
    setIsPracticeMode(false);
    setError(null);
    setShowDirections(false);
    // Сессию не удаляем — при повторном «Начать тест» она восстановится с таймером и ответами
    if (selectedDirection) await loadTests(selectedDirection);
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
        onComplete={(results) => {
          if (results) {
            setTestResults(results);
            if (selectedDirection) loadTests(selectedDirection); // один запрос: тесты + сессии
          }
        }}
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
              loadTests(direction, 1, testsPerPage);
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
          serverTimeMoscow={serverTimeMoscow}
          loading={loading}
          error={error}
          onStartTest={startTest}
          onStartPractice={(testId) => startTest(testId, true)}
          onViewResults={loadTestReview}
          onBack={goBackToTests}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onPageChange={(page) => { setCurrentPage(page); loadTests(selectedDirection, page, testsPerPage); }}
          testsPagination={null}
          testsPerPage={testsPerPage}
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
  direction, tests, completedTests, testStats, serverTimeMoscow, loading, error, 
  onStartTest, onStartPractice, onViewResults, onBack,
  currentPage, setCurrentPage, onPageChange, testsPagination, testsPerPage = 6,
  filter, setFilter, searchTerm, setSearchTerm,
  dateFilter, setDateFilter
}) {
  // Время по Москве с сервера — для проверки доступности (нельзя обойти сменой времени на устройстве)
  const nowForAvailability = serverTimeMoscow ? new Date(serverTimeMoscow) : new Date();
  const MetaIcon = ({ name }) => {
    const common = {
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#6f42c1',
      strokeWidth: 1.9,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: 'tests_meta_icon_svg'
    };

    if (name === 'clock') {
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    }

    if (name === 'calendar') {
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    }

    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M12 11v5" />
      </svg>
    );
  };

  const formatDateHuman = (dateValue) => {
    if (!dateValue) return '—';
    const dt = new Date(dateValue);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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

  // Группировка тестов (доступность по московскому времени с сервера)
  const groupTests = (tests) => {
    const now = nowForAvailability;
    const available = [];
    const upcoming = [];
    const completed = [];
    const missed = [];
    const external = []; // Внешние тесты
    
    tests.forEach(test => {
      // Проверяем, является ли тест внешним
      if (test.isExternal || test.externalTest) {
        external.push(test);
        return; // Внешние тесты не обрабатываются дальше
      }
      
      const startDate = new Date(test.startDate);
      const endDate = new Date(test.endDate);
      // Бэкенд уже присылает isCompleted по сессиям студента; дублируем проверкой по локальному списку
      const isCompleted =
        test.isCompleted === true ||
        (getTestId(test) && completedTests.some(c => String(c.testId) === getTestId(test)));

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
    
    return { available, upcoming, completed, missed, external };
  };

  // Фильтрация тестов
  const filterTests = (tests, searchTerm) => {
    if (!searchTerm) return tests;
    return tests.filter(test => {
      const testName = (test.title || test.name || '').toLowerCase();
      return testName.includes(searchTerm.toLowerCase());
    });
  };

  // Фильтрация по датам
  const filterTestsByDate = (tests, dateFilter) => {
    if (!dateFilter.startDate && !dateFilter.endDate) return tests;
    
    return tests.filter(test => {
      // Внешние тесты фильтруем по дате теста
      if (test.isExternal || test.externalTest) {
        if (!test.date) return false;
        const testDate = new Date(test.date);
        let matchesStart = true;
        let matchesEnd = true;
        
        if (dateFilter.startDate) {
          const filterStartDate = new Date(dateFilter.startDate);
          matchesStart = testDate >= filterStartDate;
        }
        
        if (dateFilter.endDate) {
          const filterEndDate = new Date(dateFilter.endDate);
          matchesEnd = testDate <= filterEndDate;
        }
        
        return matchesStart && matchesEnd;
      }
      
      // Обычные тесты фильтруем по периодам
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
  const paginateTests = (tests, page, itemsPerPage = 6) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tests.slice(startIndex, endIndex);
  };

  const getTestId = (test) => String(test?.id ?? test?._id ?? '');
  const isTestCompleted = (test) => {
    if (test?.isCompleted === true) return true;
    const tid = getTestId(test);
    return tid && completedTests.some(c => String(c.testId) === tid);
  };
  const getTestResult = (test) => {
    const tid = getTestId(test);
    const completedTest = tid ? completedTests.find(c => String(c.testId) === tid) : null;
    // Статистика сохранена по session.testId (строка) — ищем по тому же ключу
    const stats = testStats[tid] ?? testStats[test?.id] ?? testStats[test?._id];
    return completedTest ? { ...completedTest, stats } : null;
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
  const filteredExternal = filterTestsByDate(
    filterTests(groupedTests.external, searchTerm), 
    dateFilter
  );

  // Определяем какие тесты показывать в зависимости от фильтра
  let testsToShow = [];
  if (filter === 'available') testsToShow = filteredAvailable;
  else if (filter === 'upcoming') testsToShow = filteredUpcoming;
  else if (filter === 'completed') testsToShow = filteredCompleted;
  else if (filter === 'missed') testsToShow = filteredMissed;
  else testsToShow = [...filteredAvailable, ...filteredUpcoming, ...filteredCompleted, ...filteredMissed, ...filteredExternal];

  const paginatedTests = testsToShow;
  const totalPages = 1;

  const TestCard = ({ test, type }) => {
    // Проверяем, является ли тест внешним
    const isExternal = test.isExternal || test.externalTest;
    
    // Для внешних тестов используем другую логику
    if (isExternal) {
      const hasResult = test.hasResult && test.rate !== null && test.rate !== undefined;
      
      return (
        <div key={test.id} className={`tests_test_card external ${hasResult ? 'completed' : ''}`}>
          <div className="tests_test_card_header">
            <h3 className="tests_test_title">{test.name || test.title}</h3>
            <div className="tests_test_type_badge external">
              Вне системы CPM-LMS
            </div>
          </div>
          
          <div className="tests_test_info tests_test_info_compact">
            <p className="tests_external_notice">
              <strong>⚠️ Тест проводился вне платформы CPM-LMS</strong>
            </p>
            <div className="tests_meta_row">
              <span className="tests_meta_icon"><MetaIcon name="calendar" /></span>
              <span><strong>Дата:</strong> {formatDateHuman(test.date)}</span>
            </div>
            {hasResult ? (
              <div className="tests_test_completed_info tests_score_card">
                <div className="tests_score_head">
                  <span>Рейтинговый балл</span>
                  <strong>{test.rate} / 100</strong>
                </div>
                <div className="tests_score_progress">
                  <div className="tests_score_progress_fill" style={{ width: `${Math.max(0, Math.min(100, Number(test.rate) || 0))}%` }} />
                </div>
              </div>
            ) : (
              <p className="tests_test_status">Результат отсутствует</p>
            )}
          </div>
          
          <div className="tests_test_actions">
            {!hasResult ? (
              <p className="tests_external_no_result">Результат пока не добавлен в систему</p>
            ) : (
              <p className="tests_external_no_result">Прохождение недоступно (вне платформы)</p>
            )}
          </div>
        </div>
      );
    }
    
    // Логика для обычных тестов (доступность по Москве с сервера)
    const completed = isTestCompleted(test);
    const testResult = getTestResult(test);
    const now = nowForAvailability;
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    const available = now >= startDate && now <= endDate;

    const ratingScore = parseInt(testResult?.score, 10) || 0;
    const showAsCompleted = completed;
    return (
      <div key={test.id} className={`tests_test_card ${showAsCompleted ? 'completed' : ''} ${type}`}>
        <div className="tests_test_card_header">
          <h3 className="tests_test_title">{test.title}</h3>
          <div className={`tests_test_type_badge ${showAsCompleted ? 'completed' : type}`}>
            {showAsCompleted && 'Сдан'}
            {!showAsCompleted && type === 'available' && 'Доступен'}
            {!showAsCompleted && type === 'upcoming' && 'Скоро'}
            {!showAsCompleted && type === 'missed' && 'Пропущен'}
          </div>
        </div>

        <div className="tests_test_info tests_test_info_compact">
          <div className="tests_meta_row">
            <span className="tests_meta_icon"><MetaIcon name="clock" /></span>
            <span><strong>Время:</strong> {test.timeLimitMinutes} мин.</span>
          </div>
          <div className="tests_meta_row">
            <span className="tests_meta_icon"><MetaIcon name="calendar" /></span>
            <span><strong>Период:</strong> {formatDateHuman(test.startDate)} — {formatDateHuman(test.endDate)}</span>
          </div>

          {showAsCompleted ? (
            <div className="tests_test_completed_info tests_score_card">
              <div className="tests_score_head">
                <span>Рейтинговый балл</span>
                <strong>{ratingScore} / 100</strong>
              </div>
              <div className="tests_score_progress">
                <div className="tests_score_progress_fill" style={{ width: `${Math.max(0, Math.min(100, ratingScore))}%` }} />
              </div>
              {testResult?.stats ? (
                <>
                  <p><strong>Правильных ответов:</strong> {testResult.stats.correctAnswers || 0} из {testResult.stats.totalQuestions || 0}</p>
                  <p><strong>Точность:</strong> {testResult.stats.accuracy || 0}%</p>
                </>
              ) : (
                <p><em>Загрузка статистики...</em></p>
              )}
              <p><strong>Время выполнения:</strong> {testResult?.timeSpentMinutes ?? 0} мин</p>
            </div>
          ) : type === 'upcoming' ? (
            <p className="tests_test_status upcoming">Начнется {formatDateHuman(test.startDate)}</p>
          ) : type === 'missed' ? (
            <p className="tests_test_status missed">Закончился {formatDateHuman(test.endDate)}</p>
          ) : (
            <p className={`tests_test_status ${available ? 'available' : 'unavailable'}`}>
              {available ? 'Доступен' : 'Недоступен'}
            </p>
          )}
        </div>
        
        <div className="tests_test_actions">
          {!completed && available && (test.canStart !== false) && (
            <button 
              className="tests_start_btn enabled"
              onClick={() => onStartTest(test.id ?? test._id)}
            >
              Начать тест
            </button>
          )}
          
          {completed && (
            <>
              {testResult?.id && (
                <button 
                  className="tests_view_results_btn"
                  onClick={() => onViewResults(test.id ?? test._id, testResult.id)}
                >
                  Посмотреть результаты
                </button>
              )}
              <button 
                className="tests_practice_btn"
                onClick={() => onStartPractice(test.id ?? test._id)}
              >
                Потренироваться
              </button>
            </>
          )}
          
          {type === 'upcoming' && !showAsCompleted && (
            <p className="tests_inline_hint">Скоро будет доступен</p>
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
            // Для внешних тестов не определяем тип
            if (test.isExternal || test.externalTest) {
              return <TestCard key={test.id} test={test} type="external" />;
            }
            
            const completed = isTestCompleted(test);
            const now = nowForAvailability;
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

      {/* Пагинация отключена по задаче: показываем весь отфильтрованный список */}
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

  // По истечении времени — автоматически отправить частичный результат и очистить сессию
  useEffect(() => {
    if (isTimeUp && !isCompleted && !isSubmitting) {
      handleAutoCompleteTest();
    }
  }, [isTimeUp]);

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
        const response = await axios.post(`${API_EXAM_URL}/create-test-session`, {
          studentId: getStudentId(),
          testId: test._id,
          testTitle: test.title,
          answers: calculatedAnswers,
          timeSpentMinutes: timeSpentMinutes,
          score: ratingScore
        });

        console.log('Тест автоматически завершен, ID сессии:', response.data.id);
          setIsCompleted(true);
          localStorage.removeItem('testSession');
          onComplete(results);
      } catch (error) {
        console.error('Ошибка отправки результатов:', error);
        
        // Различаем типы ошибок
        if (error.response?.status === 409) {
          const data = error.response?.data || {};
          const existingScore = data.existingScore != null ? Number(data.existingScore) : results.ratingScore;
          setSubmitError(`Тест уже был сдан ранее. Результат: ${existingScore} баллов`);
          setIsCompleted(true);
          localStorage.removeItem('testSession');
          onComplete({ ...results, ratingScore: existingScore });
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
      localStorage.removeItem('testSession');
      onComplete(results);
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
        const response = await axios.post(`${API_EXAM_URL}/create-test-session`, {
          studentId: getStudentId(),
          testId: test._id,
          testTitle: test.title,
          answers: calculatedAnswers,
          timeSpentMinutes: timeSpentMinutes,
          score: ratingScore
        });

        setIsCompleted(true);
        localStorage.removeItem('testSession');
        onComplete(results);
        if (response?.data?.id) console.log('Тест завершен, ID сессии:', response.data.id);
      } catch (error) {
        console.error('Ошибка отправки результатов:', error);
        
        // Различаем типы ошибок
        if (error.response?.status === 409) {
          const data = error.response?.data || {};
          const existingScore = data.existingScore != null ? Number(data.existingScore) : results.ratingScore;
          setSubmitError(`Тест уже был сдан ранее. Результат: ${existingScore} баллов`);
          setIsCompleted(true);
          localStorage.removeItem('testSession');
          onComplete({ ...results, ratingScore: existingScore });
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
      localStorage.removeItem('testSession');
      onComplete(results);
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
        <button
          className="tests_back_btn"
          onClick={() => {
            const stateToSave = { ...session, currentQuestionIndex, answers };
            localStorage.setItem('testSession', JSON.stringify(stateToSave));
            onBack();
          }}
        >
          ← Назад
        </button>
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
            <p>{isSubmitting ? 'Отправка ваших ответов…' : 'Ваши ответы отправляются автоматически.'}</p>
            {!isSubmitting && (
              <div className="tests_timeup_modal_buttons">
                <button
                  className="tests_timeup_btn tests_timeup_btn_primary"
                  onClick={handleCompleteTest}
                >
                  Завершить тест
                </button>
              </div>
            )}
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