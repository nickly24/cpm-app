import React, { useState, useEffect } from 'react';
import Homework from './AdminFunctions/Homework/Homework';
import GroupsFunc from './AdminFunctions/Groups/GroupsFunc';
import Attendance from './AdminFunctions/Attendance/Attendance';
import UsersByRole from './AdminFunctions/Users/UsersByRole';
import TestsManagement from './AdminFunctions/Tests/TestsManagement';
import { ScanAttendance } from './AdminFunctions/ScanAttedance/ScanAttendance';
import Exams from './AdminFunctions/Exams/Exams'; // Добавляем импорт нового компонента

const AdminCabinet = () => {
  const hash = window.location.hash.substring(1);
  const [currentView, setCurrentView] = useState(hash || 'main');
  
  const adminName = localStorage.getItem('full_name') || 'Администратор';
  const adminId = localStorage.getItem('id');
  
  useEffect(() => {
    if (currentView === 'main') {
      window.location.hash = '';
    } else {
      window.location.hash = currentView;
    }
  }, [currentView]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const renderView = () => {
    switch(currentView) {
      case 'users':
        return <UsersByRole />;
      case 'groups':
        return <GroupsFunc />;
      case 'assignments':
        return <Homework />;
      case 'attendance':
        return <Attendance />;
      case 'tests':
        return <TestsManagement />;
      case 'scan':
        return <ScanAttendance />;
      case 'exams': // Добавляем новый case для экзаменов
        return <Exams />;
      default:
        return (
          <div className="admin-features">
            <div 
              className="feature-card" 
              onClick={() => setCurrentView('users')}
            >
              <h3>Пользователи</h3>
              <p>Управление всеми пользователями системы</p>
            </div>
            
            <div 
              className="feature-card" 
              onClick={() => setCurrentView('groups')}
            >
              <h3>Группы</h3>
              <p>Создание и редактирование учебных групп</p>
            </div>
            
            <div 
              className="feature-card" 
              onClick={() => setCurrentView('assignments')}
            >
              <h3>Домашние задания</h3>
              <p>Управление учебными материалами</p>
            </div>

            <div 
              className="feature-card" 
              onClick={() => setCurrentView('attendance')}
            >
              <h3>Посещаемость</h3>
              <p>Управление посещаемостью студентов</p>
            </div>
            
            <div 
              className="feature-card" 
              onClick={() => setCurrentView('tests')}
            >
              <h3>Тесты</h3>
              <p>Управление тестами студентов</p>
            </div>
            
            <div 
              className="feature-card" 
              onClick={() => setCurrentView('scan')}
            >
              <h3>Скан</h3>
              <p>Сканировать посещаемость</p>
            </div>
            
            {/* Добавляем новую карточку для экзаменов */}
            <div 
              className="feature-card" 
              onClick={() => setCurrentView('exams')}
            >
              <h3>Экзамены</h3>
              <p>Управление экзаменами и расписанием</p>
            </div>
          </div>
        );
    }
  };

  // Остальной код остается без изменений
  return (
    <div className="admin-cabinet">
      <header className="cabinet-header">
        <h1>Панель администратора</h1>
        <div className="user-info">
          <span>{adminName} | ID: {adminId}</span>
          <button onClick={handleLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </header>

      <main className="cabinet-content">
        {currentView !== 'main' && (
          <button 
            onClick={() => setCurrentView('main')} 
            className="back-button"
          >
            ← Назад к меню
          </button>
        )}
        
        <div className="admin-welcome">
          {currentView === 'main' ? (
            <>
              <h2>Добро пожаловать в панель управления</h2>
              <p>Выберите раздел для работы</p>
            </>
          ) : null}
          
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default AdminCabinet;