import React, { useState, useEffect, useRef } from 'react';
import axios from '../../api';

import { API_BASE_URL } from '../../Config';

export default function FlashcardMode({ theme, studentId, onBack }) {
  const [cards, setCards] = useState([]);
  const [learnedCardsCount, setLearnedCardsCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [animationState, setAnimationState] = useState('idle'); // 'idle' | 'flipping' | 'swiping-left' | 'swiping-right'
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem('flash_onboarding_seen') !== 'true';
    } catch {
      return true;
    }
  });
  
  const touchStartX = useRef(0);
  const cardRef = useRef(null);
  const mouseDragging = useRef(false);
  const mouseStartX = useRef(0);
  const wasDragging = useRef(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const [unlearnedResponse, learnedResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/cadrs-by-theme/${studentId}/${theme.id}`),
          axios.get(`${API_BASE_URL}/learned-questions/${studentId}/${theme.id}`)
        ]);
        
        const shuffled = [...unlearnedResponse.data.cards_to_learn].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setLearnedCardsCount(learnedResponse.data.count || 0);
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };

    fetchCards();
  }, [theme.id, studentId]);

  const handleFlip = () => {
    if (animationState !== 'idle') return;
    if (wasDragging.current) {
      // Игнорируем клик сразу после драга, чтобы не было нежелательного флипа
      wasDragging.current = false;
      return;
    }
    setAnimationState('flipping');
    setIsFlipped(!isFlipped);
    setTimeout(() => setAnimationState('idle'), 300);
  };

  const animateCardTransition = (direction) => {
    return new Promise(resolve => {
      setAnimationState(`swiping-${direction}`);
      setTimeout(() => {
        setAnimationState('idle');
        resolve();
      }, 300);
    });
  };

  const handleNext = async () => {
    if (animationState !== 'idle') return;
    setIsFlipped(false);
    setSwipeOffset(0);
    await animateCardTransition('left');
    setCurrentIndex(prev => (prev + 1) % cards.length);
    setIsFlipped(false);
  };

  const handleRemember = async () => {
    if (animationState !== 'idle') return;
    setIsFlipped(false);
    setSwipeOffset(0);
    try {
      await animateCardTransition('right');
      
      await axios.post(`${API_BASE_URL}/add-learned-question`, {
        student_id: studentId,
        question_id: cards[currentIndex].id
      });
      
      setLearnedCardsCount(prev => prev + 1);
      setCards(prev => prev.filter((_, i) => i !== currentIndex));
      
      if (cards.length === 1) {
        onBack();
      } else {
        setCurrentIndex(prev => prev >= cards.length - 1 ? 0 : prev);
        setIsFlipped(false);
      }
    } catch (error) {
      console.error('Error marking as learned:', error);
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    if (showOnboarding) return;
    touchStartX.current = e.touches[0].clientX;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (showOnboarding) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    setSwipeOffset(deltaX);
    if (Math.abs(deltaX) > 5) wasDragging.current = true;
  };

  const handleTouchEnd = () => {
    if (showOnboarding) return;
    if (swipeOffset > 100) {
      handleRemember();
    } else if (swipeOffset < -100) {
      handleNext();
    }
    setSwipeOffset(0);
    // Сбрасываем флаг после короткой задержки, чтобы onClick не сработал
    setTimeout(() => { wasDragging.current = false; }, 0);
  };

  // Mouse (desktop) swipe support
  const handleMouseDown = (e) => {
    if (showOnboarding) return;
    mouseDragging.current = true;
    mouseStartX.current = e.clientX;
    setSwipeOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!mouseDragging.current || showOnboarding) return;
    const deltaX = e.clientX - mouseStartX.current;
    setSwipeOffset(deltaX);
    if (Math.abs(deltaX) > 3) wasDragging.current = true;
  };

  const handleMouseUp = () => {
    if (!mouseDragging.current || showOnboarding) return;
    mouseDragging.current = false;
    if (swipeOffset > 120) {
      handleRemember();
    } else if (swipeOffset < -120) {
      handleNext();
    } else {
      setSwipeOffset(0);
    }
    // Сбрасываем флаг после короткой задержки, чтобы onClick не сработал
    setTimeout(() => { wasDragging.current = false; }, 0);
  };

  if (cards.length === 0) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-complete">
          <h3>Все карточки изучены!</h3>
          <button className="back-button" onClick={onBack}>
            Вернуться к теме
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const nextCard = cards[(currentIndex + 1) % cards.length];
  const rotation = Math.max(-15, Math.min(15, (swipeOffset / 15)));
  const rememberOpacity = Math.min(1, Math.max(0, swipeOffset / 140));
  const repeatOpacity = Math.min(1, Math.max(0, -swipeOffset / 140));
  const cardTransform = animationState === 'idle' && swipeOffset
    ? `translateX(${swipeOffset}px) rotate(${rotation}deg)`
    : undefined;

  return (
    <div className="flashcard-container">
      <button className="flashcard-back-button" onClick={onBack}>
        ← Назад к теме
      </button>
      {showOnboarding && (
        <div className="flashcard-onboarding">
          <div className="onboarding-card">
            <h3>Как работать с карточками</h3>
            <ul>
              <li>Нажми на карточку, чтобы увидеть ответ.</li>
              <li>
                Свайп вправо — <strong>запомнил</strong>.
              </li>
              <li>
                Свайп влево — <strong>повторить позже</strong>.
              </li>
            </ul>
            <div className="swipe-hints">
              <div className="hint-left">⬅ Повторить</div>
              <div className="hint-right">Запомнил ➡</div>
            </div>
            <button
              className="onboarding-button"
              onClick={() => {
                try { localStorage.setItem('flash_onboarding_seen', 'true'); } catch {}
                setShowOnboarding(false);
              }}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
      <div className="progress-header">
        Прогресс: {learnedCardsCount} / {cards.length + learnedCardsCount}
      </div>
      
      <div className="cards-wrapper">
        {/* Next card (peeking from behind) */}
        {animationState === 'idle' && (
          <div className="flashcard next-card">
            <div className="flashcard-inner">
              <div className="flashcard-front">
                {nextCard.question}
              </div>
            </div>
          </div>
        )}
        
        {/* Current card */}
        <div 
          ref={cardRef}
          className={`flashcard current-card 
            ${isFlipped ? 'flipped' : ''} 
            ${animationState === 'swiping-left' ? 'swipe-left' : ''}
            ${animationState === 'swiping-right' ? 'swipe-right' : ''}`}
          style={{ transform: cardTransform }}
          onClick={handleFlip}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              {currentCard.question}
            </div>
            <div className="flashcard-back">
              {currentCard.answer}
            </div>
          </div>
          {/* Drag badges */}
          <div className="drag-badge badge-remember" style={{ opacity: rememberOpacity }}>
            Запомнил
          </div>
          <div className="drag-badge badge-repeat" style={{ opacity: repeatOpacity }}>
            Повторить
          </div>
        </div>
      </div>
      
      <div className="flashcard-controls">
        <button 
          className="control-button remember-button"
          onClick={handleRemember}
          disabled={animationState !== 'idle'}
          aria-label="Запомнил"
        >
          ✅
        </button>
        <button 
          className="control-button next-button"
          onClick={handleNext}
          disabled={animationState !== 'idle'}
          aria-label="Повторить позже"
        >
          ❌
        </button>
      </div>
    </div>
  );
}