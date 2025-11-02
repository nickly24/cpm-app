import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import './CreateTest.css';
import { API_EXAM_URL } from '../../../Config';

export default function TestCreate({ editingTest = null, onTestCreated = null, onTestUpdated = null, mode = 'create' }) {
  const [testData, setTestData] = useState({
    title: '',
    direction: '',
    startDate: '',
    endDate: '',
    timeLimitMinutes: 30,
    questions: [],
    isActive: true
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionId: 1,
    type: 'single',
    text: '',
    points: 1,
    answers: [
      { id: 'a', text: '', isCorrect: false },
      { id: 'b', text: '', isCorrect: false }
    ],
    correctAnswers: []
  });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [directions, setDirections] = useState([]);

  // Загрузка направлений
  useEffect(() => {
    const fetchDirections = async () => {
      try {
        const response = await axios.get(`${API_EXAM_URL}/directions`);
        setDirections(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке направлений:', error);
      }
    };
    fetchDirections();
  }, []);

  useEffect(() => {
    if (editingTest && (mode === 'edit' || mode === 'view')) {
      console.log('Загружаем тест для редактирования:', editingTest);
      console.log('isActive из сервера:', editingTest.isActive);
      console.log('Вопросы из сервера:', editingTest.questions);
      
      // Обрабатываем вопросы, убирая pointValue для множественного выбора
      const processedQuestions = (editingTest.questions || []).map(question => ({
        ...question,
        answers: question.answers ? question.answers.map(answer => {
          const { pointValue, ...answerWithoutPointValue } = answer;
          return answerWithoutPointValue;
        }) : [],
        correctAnswers: question.correctAnswers || []
      }));
      
      console.log('Обработанные вопросы:', processedQuestions);
      
      setTestData({
        title: editingTest.title || '',
        direction: editingTest.direction || '',
        startDate: editingTest.startDate ? new Date(editingTest.startDate).toISOString().slice(0, 16) : '',
        endDate: editingTest.endDate ? new Date(editingTest.endDate).toISOString().slice(0, 16) : '',
        timeLimitMinutes: editingTest.timeLimitMinutes || 30,
        questions: processedQuestions,
        isActive: editingTest.isActive !== undefined ? editingTest.isActive : true
      });
    }
  }, [editingTest, mode]);

  const isReadOnly = mode === 'view';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnswerChange = (answerIndex, field, value) => {
    setCurrentQuestion(prev => {
      // Для одиночного выбора: если ставим isCorrect = true, сбрасываем у других
      if (prev.type === 'single' && field === 'isCorrect' && value === true) {
        return {
          ...prev,
          answers: prev.answers.map((answer, index) => ({
            ...answer,
            isCorrect: index === answerIndex
          }))
        };
      }
      
      return {
      ...prev,
      answers: prev.answers.map((answer, index) => 
        index === answerIndex ? { ...answer, [field]: value } : answer
      )
      };
    });
  };

  const handleCorrectAnswerChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.map((answer, i) => 
        i === index ? value : answer
      )
    }));
  };

  const addAnswer = () => {
    const newId = String.fromCharCode(97 + currentQuestion.answers.length);
    setCurrentQuestion(prev => ({
      ...prev,
      answers: [...prev.answers, { id: newId, text: '', isCorrect: false }]
    }));
  };

  const removeAnswer = (index) => {
    if (currentQuestion.answers.length > 2) {
      setCurrentQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index)
      }));
    }
  };

  const addCorrectAnswer = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswers: [...prev.correctAnswers, '']
    }));
  };

  const removeCorrectAnswer = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    const questionToAdd = { ...currentQuestion };
    
    if (questionToAdd.type === 'text') {
      questionToAdd.answers = [];
    } else {
      questionToAdd.correctAnswers = [];
    }

    // Для множественного выбора используем фиксированные баллы за весь вопрос
    // (не рассчитываем из индивидуальных баллов ответов)

    // Проверяем, редактируем ли существующий вопрос
    const existingQuestionIndex = testData.questions.findIndex(q => q.questionId === questionToAdd.questionId);
    
    if (existingQuestionIndex !== -1) {
      // Редактируем существующий вопрос
      setTestData(prev => ({
        ...prev,
        questions: prev.questions.map((q, index) => 
          index === existingQuestionIndex ? questionToAdd : q
        )
      }));
    } else {
      // Добавляем новый вопрос
      setTestData(prev => ({
        ...prev,
        questions: [...prev.questions, questionToAdd]
      }));
    }

    setCurrentQuestion({
      questionId: testData.questions.length + 2,
      type: 'single',
      text: '',
      points: 1,
      answers: [
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false }
      ],
      correctAnswers: []
    });
    setShowQuestionForm(false);
    setShowQuestionPopup(false);
  };

  const cancelQuestionEdit = () => {
    setShowQuestionPopup(false);
    setCurrentQuestion({
      questionId: testData.questions.length + 1,
      type: 'single',
      text: '',
      points: 1,
      answers: [
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false }
      ],
      correctAnswers: []
    });
  };

  const removeQuestion = (index) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  // Функции для создания вопросов разных типов
  const createSingleChoiceQuestion = () => {
    setCurrentQuestion({
      questionId: testData.questions.length + 1,
      type: 'single',
      text: '',
      points: 1,
      answers: [
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false }
      ],
      correctAnswers: []
    });
    setShowQuestionPopup(true);
  };

  const createMultipleChoiceQuestion = () => {
    setCurrentQuestion({
      questionId: testData.questions.length + 1,
      type: 'multiple',
      text: '',
      points: 1,
      answers: [
        { id: 'a', text: '', isCorrect: false },
        { id: 'b', text: '', isCorrect: false }
      ],
      correctAnswers: []
    });
    setShowQuestionPopup(true);
  };

  const createTextQuestion = () => {
    setCurrentQuestion({
      questionId: testData.questions.length + 1,
      type: 'text',
      text: '',
      points: 1,
      answers: [],
      correctAnswers: ['']
    });
    setShowQuestionPopup(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (testData.questions.length === 0) {
      alert('Добавьте хотя бы один вопрос!');
      return;
    }

    try {
      if (mode === 'edit' && editingTest) {
        const response = await axios.put(`${API_EXAM_URL}/test/${editingTest._id}`, testData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        alert(`Тест успешно обновлен! ID: ${response.data.testId}`);
        
        if (onTestUpdated) {
          onTestUpdated();
        }
      } else {
        const response = await axios.post(`${API_EXAM_URL}/create-test`, testData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        alert(`Тест успешно создан! ID: ${response.data.id}`);
        
        setTestData({
          title: '',
          direction: '',
          startDate: '',
          endDate: '',
          timeLimitMinutes: 30,
          questions: [],
          isActive: true
        });
        
        if (onTestCreated) {
          onTestCreated();
        }
      }
    } catch (error) {
      console.error('Ошибка при создании теста:', error);
      alert('Ошибка при создании теста. Проверьте консоль для подробностей.');
    }
  };

  return (
    <div className="test_create_container">
      <h2 className="test_create_title">
        {mode === 'view' ? 'Просмотр теста' : 
         mode === 'edit' ? 'Редактирование теста' : 
         'Создание нового теста'}
      </h2>
      
      <form onSubmit={handleSubmit} className="test_create_form">
        <div className="test_create_section">
          <h3 className="test_create_section_title">Основная информация</h3>
          
          <div className="test_create_field">
            <label className="test_create_label">Название теста:</label>
            <input
              type="text"
              name="title"
              value={testData.title}
              onChange={handleInputChange}
              className="test_create_input"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="test_create_field">
            <label className="test_create_label">Направление:</label>
            <select
              name="direction"
              value={testData.direction}
              onChange={handleInputChange}
              className="test_create_input"
              required
              disabled={isReadOnly}
            >
              <option value="">Выберите направление</option>
              {directions.map((direction) => (
                <option key={direction.id} value={direction.name}>
                  {direction.name}
                </option>
              ))}
            </select>
          </div>

          <div className="test_create_field_row">
            <div className="test_create_field">
              <label className="test_create_label">Дата начала:</label>
              <input
                type="datetime-local"
                name="startDate"
                value={testData.startDate}
                onChange={handleInputChange}
                className="test_create_input"
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="test_create_field">
              <label className="test_create_label">Дата окончания:</label>
              <input
                type="datetime-local"
                name="endDate"
                value={testData.endDate}
                onChange={handleInputChange}
                className="test_create_input"
                required
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="test_create_field">
            <label className="test_create_label">Время на выполнение (минуты):</label>
            <input
              type="number"
              name="timeLimitMinutes"
              value={testData.timeLimitMinutes}
              onChange={handleInputChange}
              className="test_create_input"
              min="1"
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="test_create_field">
            <label className="test_create_checkbox_label">
              <input
                type="checkbox"
                name="isActive"
                checked={testData.isActive}
                onChange={(e) => setTestData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="test_create_checkbox"
                disabled={isReadOnly}
              />
              Тест активен
            </label>
          </div>
        </div>

        <div className="test_create_section">
          <h3 className="test_create_section_title">Вопросы ({testData.questions.length})</h3>
          
          {testData.questions.map((question, index) => (
            <div key={index} className="test_create_question_item">
              <div className="test_create_question_header">
                <span className="test_create_question_number">Вопрос {index + 1}</span>
                <div className="test_create_question_actions">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        // Правильно копируем все поля вопроса, убирая pointValue
                        const questionToEdit = {
                          ...question,
                          questionId: question.questionId || index + 1,
                          answers: question.answers ? question.answers.map(answer => {
                            const { pointValue, ...answerWithoutPointValue } = answer;
                            return answerWithoutPointValue;
                          }) : [
                            { id: 'a', text: '', isCorrect: false },
                            { id: 'b', text: '', isCorrect: false }
                          ],
                          correctAnswers: question.correctAnswers || []
                        };
                        setCurrentQuestion(questionToEdit);
                        setShowQuestionPopup(true);
                      }}
                      className="test_create_edit_btn"
                    >
                      Редактировать
                    </button>
                  )}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="test_create_remove_btn"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
              <div className="test_create_question_content">
                <p className="test_create_question_text">{question.text}</p>
                <p className="test_create_question_type">Тип: {question.type === 'single' ? 'Одиночный выбор' : question.type === 'multiple' ? 'Множественный выбор' : 'Текстовый ответ'}</p>
                <p className="test_create_question_points">Баллы: {question.points}</p>
                {question.type !== 'text' && question.answers && (
                  <div className="test_create_answers_preview">
                    <p className="test_create_answers_title">Варианты ответов:</p>
                    {question.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="test_create_answer_preview">
                        <span className={`test_create_answer_letter ${answer.isCorrect ? 'correct' : ''}`}>
                          {answer.id}.
                        </span>
                        <span className="test_create_answer_text">{answer.text}</span>
                        {answer.isCorrect && (
                          <span className="test_create_answer_correct">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {question.type === 'text' && question.correctAnswers && (
                  <div className="test_create_correct_answers_preview">
                    <p className="test_create_correct_answers_title">Правильные ответы:</p>
                    {question.correctAnswers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="test_create_correct_answer_preview">
                        • {answer}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {!isReadOnly && !showQuestionForm ? (
            <div className="test_create_add_question_buttons">
              <button
                type="button"
                onClick={createSingleChoiceQuestion}
                className="test_create_add_question_btn single"
              >
                + Одиночный выбор
              </button>
              <button
                type="button"
                onClick={createMultipleChoiceQuestion}
                className="test_create_add_question_btn multiple"
              >
                + Множественный выбор
              </button>
              <button
                type="button"
                onClick={createTextQuestion}
                className="test_create_add_question_btn text"
              >
                + Текстовый ответ
              </button>
            </div>
          ) : null}
        </div>

        {!isReadOnly && (
          <div className="test_create_actions">
            <button
              type="submit"
              className="test_create_submit_btn"
              disabled={testData.questions.length === 0}
            >
              {mode === 'edit' ? 'Сохранить изменения' : 'Создать тест'}
            </button>
          </div>
        )}
      </form>

      {/* Pop-up для создания/редактирования вопроса */}
      {showQuestionPopup && (
        <div className="test_create_popup_overlay" onClick={cancelQuestionEdit}>
          <div className="test_create_popup" onClick={(e) => e.stopPropagation()}>
            <div className="test_create_popup_header">
              <h4 className="test_create_question_form_title">
                {currentQuestion.questionId && testData.questions.some(q => q.questionId === currentQuestion.questionId) 
                  ? `Редактирование вопроса ${currentQuestion.questionId}` 
                  : 'Новый вопрос'
                }
              </h4>
              <button
                type="button"
                onClick={cancelQuestionEdit}
                className="test_create_popup_close"
              >
                ×
              </button>
            </div>

            <div className="test_create_popup_content">
              <div className="test_create_field">
                <label className="test_create_label">Текст вопроса:</label>
                <textarea
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionInputChange}
                  className="test_create_textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="test_create_field_row">
                <div className="test_create_field">
                  <label className="test_create_label">Тип вопроса:</label>
                  <select
                    name="type"
                    value={currentQuestion.type}
                    onChange={handleQuestionInputChange}
                    className="test_create_select"
                    disabled
                  >
                    <option value="single">Одиночный выбор</option>
                    <option value="multiple">Множественный выбор</option>
                    <option value="text">Текстовый ответ</option>
                  </select>
                </div>

                {currentQuestion.type !== 'multiple' && (
                  <div className="test_create_field">
                    <label className="test_create_label">Баллы:</label>
                    <input
                      type="number"
                      name="points"
                      value={currentQuestion.points}
                      onChange={handleQuestionInputChange}
                      className="test_create_input"
                      min="1"
                      required
                    />
                  </div>
                )}

                {currentQuestion.type === 'multiple' && (
                  <div className="test_create_field">
                    <label className="test_create_label">Баллы за вопрос:</label>
                    <input
                      type="number"
                      name="points"
                      value={currentQuestion.points}
                      onChange={handleQuestionInputChange}
                      className="test_create_input"
                      min="1"
                      required
                    />
                    <small className="test_create_points_note">
                      Баллы начисляются только при полном совпадении с правильными ответами
                    </small>
                  </div>
                )}
              </div>

              {currentQuestion.type !== 'text' && (
                <div className="test_create_field">
                  <label className="test_create_label">Варианты ответов:</label>
                  {currentQuestion.answers.map((answer, index) => (
                    <div key={index} className="test_create_answer_item">
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                        className="test_create_input"
                        placeholder={`Вариант ${answer.id}`}
                        required
                      />
                      <div className="test_create_answer_controls">
                        <label className="test_create_checkbox_label">
                          <input
                            type="checkbox"
                            checked={answer.isCorrect}
                            onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                            className="test_create_checkbox"
                          />
                          Правильный
                        </label>
                        {currentQuestion.answers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            className="test_create_remove_answer_btn"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addAnswer}
                    className="test_create_add_answer_btn"
                  >
                    Добавить вариант
                  </button>
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <div className="test_create_field">
                  <label className="test_create_label">Правильные ответы:</label>
                  {currentQuestion.correctAnswers.map((answer, index) => (
                    <div key={index} className="test_create_correct_answer_item">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => handleCorrectAnswerChange(index, e.target.value)}
                        className="test_create_input"
                        placeholder="Правильный ответ"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeCorrectAnswer(index)}
                        className="test_create_remove_answer_btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCorrectAnswer}
                    className="test_create_add_answer_btn"
                  >
                    Добавить правильный ответ
                  </button>
                </div>
              )}

              <div className="test_create_question_actions">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="test_create_save_question_btn"
                  disabled={!currentQuestion.text || (currentQuestion.type !== 'text' && currentQuestion.answers.length < 2)}
                >
                  Сохранить вопрос
                </button>
                <button
                  type="button"
                  onClick={cancelQuestionEdit}
                  className="test_create_cancel_btn"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

