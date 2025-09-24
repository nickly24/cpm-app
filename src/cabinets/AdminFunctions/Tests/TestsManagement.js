import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  const renderTestsList = () => (
    <div className="tests_management_container">
      <div className="tests_management_header">
        <h2 className="tests_management_title">Управление тестами</h2>
        <div className="tests_management_controls">
          <select
            value={selectedDirection}
            onChange={(e) => handleDirectionChange(e.target.value)}
            className="tests_management_direction_select"
          >
            {directions.map((direction) => (
              <option key={direction.id} value={direction.name}>
                {direction.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setCurrentView('create')}
            className="tests_management_create_btn"
          >
            + Создать новый тест
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
      ) : tests.length === 0 ? (
        <div className="tests_management_empty">
          <p>Тесты не найдены</p>
          <button
            onClick={() => setCurrentView('create')}
            className="tests_management_create_btn"
          >
            Создать первый тест
          </button>
        </div>
      ) : (
        <div className="tests_management_list">
          {tests.map((test) => (
            <div key={test.id} className="test_card">
              <div className="test_card_header">
                <h3 className="test_card_title">{test.title}</h3>
                {getStatusBadge(test)}
              </div>
              
              <div className="test_card_content">
                <div className="test_card_info">
                  <div className="test_info_item">
                    <span className="test_info_label">Направление:</span>
                    <span className="test_info_value">{selectedDirection}</span>
                  </div>
                  
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
                </div>
              </div>
              
              <div className="test_card_actions">
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
                  onClick={() => handleDeleteTest(test.id)}
                  className="test_action_btn test_action_delete"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
