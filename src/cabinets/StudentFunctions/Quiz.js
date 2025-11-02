// Training.jsx
import { useState, useEffect } from 'react';
import axios from '../../api';
import './Quiz.css';
import { API_BASE_URL } from '../../Config';
const Quiz = ({ onBack }) => {
  const [currentCard, setCurrentCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRandomQuestion = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/get-random-question`);
      
      if (response.data.status && response.data.res) {
        setCurrentCard(response.data.res);
      } else {
        throw new Error('Неверный формат данных');
      }
    } catch (err) {
      console.error('Ошибка при загрузке вопроса:', err);
      setError('Не удалось загрузить вопрос. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const handleCardClick = () => {
    if (isFlipped) {
      // Если карточка перевернута, загружаем новый вопрос
      fetchRandomQuestion();
      setIsFlipped(false);
    } else {
      // Иначе просто переворачиваем карточку
      setIsFlipped(true);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    fetchRandomQuestion();
  };

  return (
    <div className="training-section">
      <button onClick={onBack} className="back-button">← Назад</button>
      <h2>Тренировка</h2>
      
      <div className="quiz-container">
        {isLoading ? (
          <div className="loading-message">Загрузка вопроса...</div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={fetchRandomQuestion} className="retry-button">
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            <div 
              className={`quiz-card ${isFlipped ? 'flipped' : ''}`}
              onClick={handleCardClick}
            >
              <div className="card-face front">
                <h3>Вопрос</h3>
                <p>{currentCard.question}</p>
                <div className="hint">Нажмите, чтобы увидеть ответ</div>
              </div>
              <div className="card-face back">
                <h3>Ответ</h3>
                <p>{currentCard.answer}</p>
                <div className="hint">Нажмите, чтобы продолжить</div>
              </div>
            </div>
            
            <button 
              onClick={handleNextCard}
              className="next-button"
            >
              Следующий вопрос
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;