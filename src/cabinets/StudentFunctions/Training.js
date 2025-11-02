import React, { useState, useEffect } from 'react';
import ThemeList from './ThemeList';
import ThemeDetail from './ThemeDetail';
import FlashcardMode from './FlashcardMode';
import './Training.css';
import axios from '../../api';
import { API_BASE_URL } from '../../Config';
import { useAuth } from '../../AuthContext';

export default function Training() {
  const { user } = useAuth();
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [viewMode, setViewMode] = useState('themes');
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = user?.id;
    if (!id) {
      setError('Student ID not found');
      setLoading(false);
      return;
    }
    
    setStudentId(id);
    fetchThemes(id);
  }, [user]);

  const fetchThemes = async (studentId) => {
    try {
      const themesResponse = await axios.get(`${API_BASE_URL}/get-themes`);
      const themesWithProgress = await Promise.all(
        themesResponse.data.map(async theme => {
          const progressResponse = await axios.get(
            `${API_BASE_URL}/all-cards-by-theme/${studentId}/${theme.id}`
          );
          return {
            ...theme,
            progress: Math.round(
              (progressResponse.data.learned_cards / progressResponse.data.total_cards) * 100
            ) || 0
          };
        })
      );
      setThemes(themesWithProgress);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch themes');
      setLoading(false);
    }
  };

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setViewMode('detail');
  };

  const handleStartFlashcards = () => {
    setViewMode('flashcards');
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode('themes');
      fetchThemes(studentId); // Обновляем данные при возврате
    } else if (viewMode === 'flashcards') {
      setViewMode('detail');
    }
  };

  const updateThemeProgress = async () => {
    if (!selectedTheme || !studentId) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/all-cards-by-theme/${studentId}/${selectedTheme.id}`
      );
      const progress = Math.round(
        (response.data.learned_cards / response.data.total_cards) * 100
      ) || 0;
      
      setThemes(prevThemes => 
        prevThemes.map(theme => 
          theme.id === selectedTheme.id 
            ? { ...theme, progress } 
            : theme
        )
      );
      
      setSelectedTheme(prev => ({ ...prev, progress }));
    } catch (error) {
      console.error('Error updating theme progress:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="training-container">
      {viewMode === 'themes' && (
        <ThemeList 
          themes={themes} 
          onSelect={handleThemeSelect} 
        />
      )}
      
      {viewMode === 'detail' && selectedTheme && (
        <ThemeDetail 
          theme={selectedTheme} 
          studentId={studentId} 
          onBack={handleBack}
          onStartFlashcards={handleStartFlashcards}
          onUpdateProgress={updateThemeProgress} // Передаем функцию обновления
        />
      )}
      
      {viewMode === 'flashcards' && selectedTheme && (
        <FlashcardMode 
          theme={selectedTheme} 
          studentId={studentId} 
          onBack={handleBack}
          onUpdateProgress={updateThemeProgress} // Передаем функцию обновления
        />
      )}
    </div>
  );
}