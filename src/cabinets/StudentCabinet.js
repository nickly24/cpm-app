import React, { useState, useEffect, useRef } from 'react';
import StudentHomeworkList from './StudentFunctions/StudentHomeworkList';
import MainContent from './StudentFunctions/MainContent';
import Tests from './StudentFunctions/Tests';
import { ReactComponent as Logo } from './logo.svg';
import './StudentCabinetModern.css';
import Exams from './StudentFunctions/Exams';
import StudendAttendance from './StudentFunctions/StudentAttendance';
import Progress from './StudentFunctions/Progress';
import Training from './StudentFunctions/Training';
import StudentSchedule from './StudentFunctions/StudentSchedule';
import ZapsContainer from './StudentFunctions/ZapsContainer';
import { useAuth } from '../AuthContext';

const StudentCabinet = () => {
  const { user, logout } = useAuth();
  const studentName = user?.full_name || 'Студент';
  const groupId = user?.group_id || 'не указана';
  const studentId = user?.id;
  
  const [activeComponent, setActiveComponent] = useState('performance');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  
  // Определяем размер экрана
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Сбрасываем состояние сворачивания при переходе на мобильный
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Если меню открыто И клик был не по сайдбару И не по кнопке меню
      if (isMenuOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) && 
          menuButtonRef.current && 
          !menuButtonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // Добавляем обработчик при монтировании
    document.addEventListener('mousedown', handleClickOutside);
    
    // Удаляем обработчик при размонтировании
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await logout();
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'homework':
        return <StudentHomeworkList />;
      case 'tests':
        return <Tests />;
      case 'exams':
        return <Exams/>;
      case 'performance':
        return <Progress/>;
      case 'attendance':
        return <StudendAttendance/>
      case 'train':
        return <Training/>  
      case 'schedule':
        return <StudentSchedule/>
      case 'zaps':
        return <ZapsContainer/>
      default:
        return <Progress/>
    }
  };

  return (
    <div className="sc-wrapper">
      <header className="sc-header">
        <div className="sc-header-left">
          <Logo className="sc-logo"/>
          <div className="sc-user-meta">
            <span className="sc-user-name">{studentName}</span>
            {groupId && <span className="sc-user-group">Группа: {groupId}</span>}
          </div>
        </div>
        <div className="sc-header-right">
          <button onClick={handleLogout} className="sc-logout-button">
            Выйти
          </button>
          <button 
            ref={menuButtonRef}
            className={`sc-mobile-menu-button ${isMenuOpen ? 'sc-is-open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Открыть меню"
            aria-expanded={isMenuOpen}
          >
            <span className="sc-burger-icon">
              <span className={`sc-burger-line ${isMenuOpen ? 'open' : ''}`}></span>
              <span className={`sc-burger-line ${isMenuOpen ? 'open' : ''}`}></span>
              <span className={`sc-burger-line ${isMenuOpen ? 'open' : ''}`}></span>
            </span>
          </button>
        </div>
      </header>

      <div className={`sc-cabinet ${isSidebarCollapsed ? 'sc-with-collapsed' : ''}`}>
        <aside 
          ref={sidebarRef}
          className={`sc-sidebar ${isMenuOpen ? 'sc-is-open' : ''} ${isSidebarCollapsed ? 'sc-collapsed' : ''}`}
        >
          <nav className="sc-sidebar-nav">
            <button 
              className={`sc-nav-button ${activeComponent === 'performance' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('performance');
                setIsMenuOpen(false);
              }}
            >
              <span>📈</span>
              <span>Успеваемость</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'homework' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('homework');
                setIsMenuOpen(false);
              }}
            >
              <span>📝</span>
              <span>Домашка</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'tests' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('tests');
                setIsMenuOpen(false);
              }}
            >
              <span>📊</span>
              <span>Тесты</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'exams' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('exams');
                setIsMenuOpen(false);
              }}
            >
              <span>🎓</span>
              <span>Экзамены</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'attendance' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('attendance');
                setIsMenuOpen(false);
              }}
            >
              <span>📅</span>
              <span>Посещаемость</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'train' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('train');
                setIsMenuOpen(false);
              }}
            >
              <span>🧠</span>
              <span>Тренировка</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'schedule' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('schedule');
                setIsMenuOpen(false);
              }}
            >
              <span>📚</span>
              <span>Расписание</span>
            </button>
            <button 
              className={`sc-nav-button ${activeComponent === 'zaps' ? 'sc-is-active' : ''}`}
              onClick={() => {
                setActiveComponent('zaps');
                setIsMenuOpen(false);
              }}
            >
              <span>📋</span>
              <span>Запросы на отгул</span>
            </button>
          </nav>
          
          {/* Кнопка сворачивания на больших экранах */}
          {!isMobile && (
            <div className="sc-sidebar-footer">
              <button 
                className="sc-sidebar-toggle"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Развернуть' : 'Свернуть'}
              >
                {isSidebarCollapsed ? '→' : '← Свернуть'}
              </button>
            </div>
          )}
        </aside>

        <main className="sc-main-content">
          {renderComponent()}
        </main>
      </div>
    </div>
  );
};

export default StudentCabinet;