import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import './TestsManagement.css';
import { API_EXAM_URL } from '../../../Config';
import TestCreate from './TestCreate';

const TestsManagement = () => {
  const [tests, setTests] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [editingTest, setEditingTest] = useState(null);
  const [error, setError] = useState('');
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'upcoming', 'ended'
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDirections();
  }, []);

  const fetchDirections = async () => {
    try {
      const response = await axios.get(`${API_EXAM_URL}/directions`);
      setDirections(response.data);
      if (response.data.length > 0) {
        setSelectedDirection(response.data[0].name);
        fetchTestsByDirection(response.data[0].name);
      }
    } catch (error) {
      console.error('Ошибка при загрузке направлений:', error);
      setError('Ошибка при загрузке направлений');
      setLoading(false);
    }
  };

  const fetchTestsByDirection = async (direction) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_EXAM_URL}/tests/${encodeURIComponent(direction)}`);
      setTests(response.data);
      setError('');
    } catch (error) {
      console.error('Ошибка при загрузке тестов:', error);
      setError('Ошибка при загрузке тестов');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectionChange = (direction) => {
    setSelectedDirection(direction);
    fetchTestsByDirection(direction);
  };

  const handleViewTest = async (testId) => {
    // Проверяем, не является ли это внешним тестом
    const test = tests.find(t => t.id === testId || t._id === testId);
    if (test && (test.isExternal || test.externalTest)) {
      alert('Просмотр недоступен для тестов, проведенных вне платформы CPM-LMS.');
      return;
    }
    
    try {
      const response = await axios.get(`${API_EXAM_URL}/test/${testId}`);
      setEditingTest(response.data);
      setCurrentView('view');
    } catch (error) {
      console.error('Ошибка при загрузке теста:', error);
      alert('Ошибка при загрузке теста');
    }
  };

  const handleEditTest = async (testId) => {
    // Проверяем, не является ли это внешним тестом
    const test = tests.find(t => t.id === testId || t._id === testId);
    if (test && (test.isExternal || test.externalTest)) {
      alert('Редактирование недоступно для тестов, проведенных вне платформы CPM-LMS.');
      return;
    }
    
    try {
      const response = await axios.get(`${API_EXAM_URL}/test/${testId}`);
      setEditingTest(response.data);
      setCurrentView('edit');
    } catch (error) {
      console.error('Ошибка при загрузке теста:', error);
      alert('Ошибка при загрузке теста');
    }
  };

  const handleDeleteTest = async (testId) => {
    // Проверяем, не является ли это внешним тестом
    const test = tests.find(t => t.id === testId || t._id === testId);
    if (test && (test.isExternal || test.externalTest)) {
      alert('Удаление недоступно для тестов, проведенных вне платформы CPM-LMS.');
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите удалить этот тест? Это действие также удалит все связанные тест-сессии и не может быть отменено.')) {
      try {
        const response = await axios.delete(`${API_EXAM_URL}/test/${testId}`);
        alert(`Тест успешно удален! Удалено сессий: ${response.data.deletedSessions}`);
        fetchTestsByDirection(selectedDirection);
      } catch (error) {
        console.error('Ошибка при удалении теста:', error);
        if (error.response?.status === 404) {
          alert('Тест не найден');
        } else {
          alert('Ошибка при удалении теста');
        }
      }
    }
  };

  const handleToggleVisibility = async (testId) => {
    // Проверяем, не является ли это внешним тестом
    const test = tests.find(t => t.id === testId || t._id === testId);
    if (test && (test.isExternal || test.externalTest)) {
      alert('Управление видимостью недоступно для тестов, проведенных вне платформы CPM-LMS.');
      return;
    }
    
    try {
      const response = await axios.put(`${API_EXAM_URL}/test/${testId}/toggle-visibility`);
      // Обновляем тест в списке
      setTests(tests.map(t => {
        if (t.id === testId || t._id === testId) {
          return { ...t, visible: response.data.visible };
        }
        return t;
      }));
      // Показываем сообщение об успехе
      alert(response.data.message);
    } catch (error) {
      console.error('Ошибка при переключении видимости:', error);
      if (error.response?.status === 404) {
        alert('Тест не найден');
      } else {
        alert('Ошибка при переключении видимости теста');
      }
    }
  };

  const handleTestCreated = () => {
    setCurrentView('list');
    fetchTestsByDirection(selectedDirection);
  };

  const handleTestUpdated = () => {
    setCurrentView('list');
    setEditingTest(null);
    fetchTestsByDirection(selectedDirection);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getStatusBadge = (test) => {
    // Для внешних тестов показываем специальный бейдж
    if (test.isExternal || test.externalTest) {
      return <span className="test_status_badge test_status_external">Вне системы CPM-LMS</span>;
    }
    
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);

    if (now < startDate) {
      return <span className="test_status_badge test_status_upcoming">Скоро начнется</span>;
    }

    if (now > endDate) {
      return <span className="test_status_badge test_status_ended">Завершен</span>;
    }

    return <span className="test_status_badge test_status_active">Активен</span>;
  };

  // Функции фильтрации
  const getTestStatus = (test) => {
    // Внешние тесты не имеют статуса по датам
    if (test.isExternal || test.externalTest) {
      return 'external';
    }
    
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);

    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'ended';
    return 'active';
  };

  const filterTests = (tests) => {
    let filtered = tests;

    // Фильтр по поиску
    if (searchTerm) {
      filtered = filtered.filter(test => {
        const testName = (test.name || test.title || '').toLowerCase();
        return testName.includes(searchTerm.toLowerCase());
      });
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => getTestStatus(test) === statusFilter);
    }

    // Фильтр по датам
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(test => {
        // Для внешних тестов фильтруем по дате проведения
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
        
        // Для обычных тестов фильтруем по периодам
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
    }

    return filtered;
  };

  // Пагинация
  const paginateTests = (tests, page, itemsPerPage = 6) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return tests.slice(startIndex, endIndex);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const renderTestsList = () => {
    const filteredTests = filterTests(tests);
    const paginatedTests = paginateTests(filteredTests, currentPage);
    const totalPages = Math.ceil(filteredTests.length / 6);

    return (
      <div className="tests_management_container">
        <div className="tests_management_header">
          <h2 className="tests_management_title">Управление тестами</h2>
          <div className="tests_management_controls">
            <button
              onClick={() => setCurrentView('create')}
              className="tests_management_create_btn"
            >
              + Создать новый тест
            </button>
          </div>
        </div>

        {/* Табы направлений */}
        <div className="tests_management_directions_tabs">
          {directions.map((direction) => (
            <button
              key={direction.id}
              className={`tests_management_direction_tab ${selectedDirection === direction.name ? 'active' : ''}`}
              onClick={() => handleDirectionChange(direction.name)}
            >
              {direction.name}
            </button>
          ))}
        </div>

        {/* Фильтры */}
        <div className="tests_management_filters">
          <div className="tests_management_search">
            <input
              type="text"
              placeholder="Поиск тестов..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="tests_management_search_input"
            />
          </div>
          
          <div className="tests_management_date_filters">
            <div className="tests_management_date_filter_group">
              <label className="tests_management_date_label">С даты:</label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => { 
                  setDateFilter({...dateFilter, startDate: e.target.value}); 
                  setCurrentPage(1); 
                }}
                className="tests_management_date_input"
              />
            </div>
            
            <div className="tests_management_date_filter_group">
              <label className="tests_management_date_label">По дату:</label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => { 
                  setDateFilter({...dateFilter, endDate: e.target.value}); 
                  setCurrentPage(1); 
                }}
                className="tests_management_date_input"
              />
            </div>
            
            <button 
              className="tests_management_clear_filters_btn"
              onClick={clearFilters}
              disabled={!searchTerm && !dateFilter.startDate && !dateFilter.endDate && statusFilter === 'all'}
            >
              Очистить фильтры
            </button>
          </div>
          
          <div className="tests_management_filter_buttons">
            <button 
              className={`tests_management_filter_btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            >
              Все ({tests.length})
            </button>
            <button 
              className={`tests_management_filter_btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            >
              Активные ({tests.filter(t => getTestStatus(t) === 'active').length})
            </button>
            <button 
              className={`tests_management_filter_btn ${statusFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('upcoming'); setCurrentPage(1); }}
            >
              Скоро ({tests.filter(t => getTestStatus(t) === 'upcoming').length})
            </button>
            <button 
              className={`tests_management_filter_btn ${statusFilter === 'ended' ? 'active' : ''}`}
              onClick={() => { setStatusFilter('ended'); setCurrentPage(1); }}
            >
              Завершенные ({tests.filter(t => getTestStatus(t) === 'ended').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="tests_management_loading">
            <div className="loading_spinner"></div>
            <p>Загрузка тестов...</p>
          </div>
        ) : error ? (
          <div className="tests_management_error">
            <p>{error}</p>
            <button onClick={() => fetchTestsByDirection(selectedDirection)} className="retry_btn">
              Попробовать снова
            </button>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="tests_management_empty">
            <p>{tests.length === 0 ? 'Тесты не найдены' : 'По фильтрам ничего не найдено'}</p>
            {tests.length === 0 ? (
              <button
                onClick={() => setCurrentView('create')}
                className="tests_management_create_btn"
              >
                Создать первый тест
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="tests_management_create_btn"
              >
                Очистить фильтры
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="tests_management_list">
              {paginatedTests.map((test) => (
            <div key={test.id} className={`test_card ${(test.isExternal || test.externalTest) ? 'test_card_external' : ''}`}>
              <div className="test_card_header">
                <h3 className="test_card_title">{test.name || test.title}</h3>
                {getStatusBadge(test)}
              </div>
              
              <div className="test_card_content">
                <div className="test_card_info">
                  <div className="test_info_item">
                    <span className="test_info_label">Направление:</span>
                    <span className="test_info_value">{selectedDirection}</span>
                  </div>
                  
                  {/* Для внешних тестов показываем другую информацию */}
                  {(test.isExternal || test.externalTest) ? (
                    <>
                      <div className="test_info_item">
                        <span className="test_info_label">Дата проведения:</span>
                        <span className="test_info_value">
                          {test.date ? formatDate(test.date) : 'Не указана'}
                        </span>
                      </div>
                      {test.hasResult && test.rate !== null && test.rate !== undefined && (
                        <div className="test_info_item">
                          <span className="test_info_label">Результат:</span>
                          <span className="test_info_value">{test.rate} баллов</span>
                        </div>
                      )}
                      <div className="test_info_item">
                        <span className="test_info_label">Статус:</span>
                        <span className="test_info_value">
                          {test.hasResult ? 'Результат добавлен' : 'Результат отсутствует'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="test_info_item">
                        <span className="test_info_label">Время:</span>
                        <span className="test_info_value">{test.timeLimitMinutes} мин</span>
                      </div>
                      
                      <div className="test_info_item">
                        <span className="test_info_label">Начало:</span>
                        <span className="test_info_value">{formatDate(test.startDate)}</span>
                      </div>
                      
                      <div className="test_info_item">
                        <span className="test_info_label">Окончание:</span>
                        <span className="test_info_value">{formatDate(test.endDate)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="test_card_actions">
                {/* Для внешних тестов не показываем кнопки редактирования и удаления */}
                {(test.isExternal || test.externalTest) ? (
                  <div className="test_external_notice">
                    <p>⚠️ Тест проводился вне платформы CPM-LMS</p>
                    <p>Редактирование и удаление недоступны</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleViewTest(test.id)}
                      className="test_action_btn test_action_view"
                    >
                      Просмотреть
                    </button>
                    <button
                      onClick={() => handleEditTest(test.id)}
                      className="test_action_btn test_action_edit"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleToggleVisibility(test.id)}
                      className={`test_action_btn test_action_toggle ${test.visible ? 'test_visible_on' : 'test_visible_off'}`}
                      title={test.visible ? 'Скрыть ответы от студентов' : 'Показать ответы студентам'}
                    >
                      {test.visible ? '👁️ Скрыть ответы' : '👁️‍🗨️ Показать ответы'}
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="test_action_btn test_action_delete"
                    >
                      Удалить
                    </button>
                  </>
                )}
              </div>
            </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="tests_management_pagination">
                <button 
                  className="tests_management_pagination_btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ← Предыдущая
                </button>
                
                <div className="tests_management_pagination_pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`tests_management_pagination_page ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="tests_management_pagination_btn"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Следующая →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderCreateView = () => (
    <div className="tests_management_create">
      <div className="tests_management_create_header">
        <button
          onClick={() => setCurrentView('list')}
          className="back_to_list_btn"
        >
          ← Назад к списку
        </button>
        <h2>Создание нового теста</h2>
      </div>
      <TestCreate onTestCreated={handleTestCreated} />
    </div>
  );

  const renderEditView = () => (
    <div className="tests_management_edit">
      <div className="tests_management_edit_header">
        <button
          onClick={() => {
            setCurrentView('list');
            setEditingTest(null);
          }}
          className="back_to_list_btn"
        >
          ← Назад к списку
        </button>
        <h2>
          {currentView === 'view' ? 'Просмотр теста' : 'Редактирование теста'}: {editingTest?.title}
        </h2>
      </div>
      <TestCreate 
        editingTest={editingTest} 
        onTestUpdated={handleTestUpdated}
        mode={currentView}
      />
    </div>
  );

  switch (currentView) {
    case 'create':
      return renderCreateView();
    case 'edit':
      return renderEditView();
    case 'view':
      return renderEditView();
    default:
      return renderTestsList();
  }
};

export default TestsManagement;
