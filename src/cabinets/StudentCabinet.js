import React, { useState, useEffect, useRef } from 'react';
import StudentHomeworkList from './StudentFunctions/StudentHomeworkList';
import MainContent from './StudentFunctions/MainContent';
import Tests from './StudentFunctions/Tests';
import { ReactComponent as Logo } from './logo.svg';
import Exams from './StudentFunctions/Exams';
import StudendAttendance from './StudentFunctions/StudentAttendance';
import Progress from './StudentFunctions/Progress';
import Training from './StudentFunctions/Training';
const StudentCabinet = () => {
  const studentName = localStorage.getItem('full_name') || 'Студент';
  const groupId = localStorage.getItem('group_id') || 'не указана';
  const studentId = localStorage.getItem('id');
  
  const [activeComponent, setActiveComponent] = useState('performance');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

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

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('id');
    localStorage.removeItem('full_name');
    localStorage.removeItem('group_id');
    window.location.reload();
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
      default:
        return <Progress/>
    }
  };

  return (
    <div className="wrapper">
      <header>
        <div className="cabinet-head">
          <div>
            <Logo/>
          </div>
          <div className="header-info">
          
              <button onClick={handleLogout} className="logout-button">
                Выйти
              </button>
           
          </div>
        </div>
      </header>

      <button 
        ref={menuButtonRef}
        className="mobile-menu-button" 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
      </button>

      <div className="cabinet-container">
        <aside 
          ref={sidebarRef}
          className={`sidebar ${isMenuOpen ? 'open' : ''}`}
        >
          <nav className="sidebar-nav">
            <button 
              className={`nav-button ${activeComponent === 'performance' ? 'active' : ''}`}
              onClick={() => {
                setActiveComponent('performance');
                setIsMenuOpen(false);
              }}
            >
              Успеваемость
            </button>
            <button 
              className={`nav-button ${activeComponent === 'homework' ? 'active' : ''}`}
              onClick={() => {
                setActiveComponent('homework');
                setIsMenuOpen(false);
              }}
            >
              Домашка
            </button>
            <button 
              className={`nav-button ${activeComponent === 'tests' ? 'active' : ''}`}
              onClick={() => {
                setActiveComponent('tests');
                setIsMenuOpen(false);
              }}
            >
              Тесты
            </button>
            <button 
              className={`nav-button ${activeComponent === 'exams' ? 'active' : ''}`}
              onClick={() => {
                setActiveComponent('exams');
                setIsMenuOpen(false);
              }}
            >
              Экзамены
            </button>
            <button 
              className={`nav-button ${activeComponent === 'attendance' ? 'active' : ''}`}
              onClick={() => {
                setActiveComponent('attendance');
                setIsMenuOpen(false);
              }}
            >
              Посещаемость
            </button>
            <button 
              className={`nav-button ${activeComponent === 'train' ? 'active' : ''}`}
              onClick={() => {
                setActiveComponent('train');
                setIsMenuOpen(false);
              }}
            >
              Тренировка
            </button>
          </nav>
        </aside>

        <main className="main-content">
          {renderComponent()}
        </main>
      </div>
    </div>
  );
};

export default StudentCabinet;