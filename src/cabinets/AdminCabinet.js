import React, { useState, useEffect } from 'react';
import Homework from './AdminFunctions/Homework/Homework';
import GroupsFunc from './AdminFunctions/Groups/GroupsFunc';
import Attendance from './AdminFunctions/Attendance/Attendance';
import UsersByRole from './AdminFunctions/Users/UsersByRole';
import TestsManagement from './AdminFunctions/Tests/TestsManagement';
import ResultsView from './AdminFunctions/Results/ResultsView';
import { ScanAttendance } from './AdminFunctions/ScanAttedance/ScanAttendance';
import Exams from './AdminFunctions/Exams/Exams';
import StudentAdd from './AdminFunctions/Users/StudentAdd';
import Schedule from './AdminFunctions/Schedule/Schedule';
import Zaps from './AdminFunctions/Zaps';
import Ratings from './AdminFunctions/Ratings/Ratings';
import { ReactComponent as Logo } from './logo.svg';
import './AdminCabinet.css';
import { useAuth } from '../AuthContext';

const AdminCabinet = () => {
  const hash = window.location.hash.substring(1);
  const [currentView, setCurrentView] = useState(hash || 'dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
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
  
  const { user, logout } = useAuth();
  const adminName = user?.full_name || 'Администратор';
  const adminId = user?.id;
  
  useEffect(() => {
    if (currentView === 'dashboard') {
      window.location.hash = '';
    } else {
      window.location.hash = currentView;
    }
  }, [currentView]);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Главная', icon: '🏠', description: 'Обзор системы' },
    { id: 'users', label: 'Пользователи', icon: '👥', description: 'Управление пользователями' },
    { id: 'add-student', label: 'Добавить студента', icon: '➕', description: 'Создание студента' },
    { id: 'schedule', label: 'Расписание', icon: '📚', description: 'Расписание занятий' },
    { id: 'groups', label: 'Группы', icon: '🏫', description: 'Учебные группы' },
    { id: 'assignments', label: 'Домашние задания', icon: '📝', description: 'Управление ДЗ' },
    { id: 'tests', label: 'Тесты', icon: '📊', description: 'Создание тестов' },
    { id: 'test-results', label: 'Результаты', icon: '📈', description: 'Результаты тестов' },
    { id: 'exams', label: 'Экзамены', icon: '🎓', description: 'Управление экзаменами' },
    { id: 'attendance', label: 'Посещаемость', icon: '📅', description: 'Учет посещаемости' },
    { id: 'scan', label: 'Сканирование', icon: '📷', description: 'Скан посещаемости' },
    { id: 'zaps', label: 'Запросы на отгул', icon: '📋', description: 'Обработка отгулов' },
    { id: 'ratings', label: 'Рейтинг', icon: '🏆', description: 'Рейтинги студентов' },
  ];

  const handleMenuClick = (viewId) => {
    setCurrentView(viewId);
    setIsMobileSidebarOpen(false);
  };

  const renderView = () => {
    switch(currentView) {
      case 'users':
        return <UsersByRole />;
      case 'add-student':
        return <StudentAdd />;
      case 'schedule':
        return <Schedule />;
      case 'groups':
        return <GroupsFunc />;
      case 'assignments':
        return <Homework />;
      case 'attendance':
        return <Attendance />;
      case 'tests':
        return <TestsManagement />;
      case 'test-results':
        return <ResultsView />;
      case 'scan':
        return <ScanAttendance />;
      case 'exams':
        return <Exams />;
      case 'zaps':
        return <Zaps />;
      case 'ratings':
        return <Ratings />;
      case 'dashboard':
      default:
        return (
          <div className="dashboard-content">
            <div className="dashboard-header">
              <h2>Добро пожаловать, {adminName}! 👋</h2>
              <p className="dashboard-subtitle">Выберите раздел для работы в боковом меню</p>
            </div>
            
            <div className="dashboard-grid">
              {menuItems.filter(item => item.id !== 'dashboard').map(item => (
                <div 
                  key={item.id}
                  className="dashboard-card" 
                  onClick={() => handleMenuClick(item.id)}
                  style={item.id === 'add-student' ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none'
                  } : {}}
                >
                  <div className="dashboard-card-icon">{item.icon}</div>
                  <h3 style={item.id === 'add-student' ? { color: 'white' } : {}}>{item.label}</h3>
                  <p style={item.id === 'add-student' ? { color: 'rgba(255,255,255,0.9)' } : {}}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Logo />
            {!isSidebarCollapsed && <span className="logo-text">CPM Admin</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isSidebarCollapsed && (
                <span className="nav-label">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Показываем кнопку сворачивания только на больших экранах */}
        {!isMobile && (
          <div className="sidebar-footer">
            <button 
              className="sidebar-toggle"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Развернуть' : 'Свернуть'}
            >
              <span className="toggle-icon">{isSidebarCollapsed ? '→' : '←'}</span>
              {!isSidebarCollapsed && <span>Свернуть</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button 
            className={`mobile-menu-btn ${isMobileSidebarOpen ? 'active' : ''}`}
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <span className="burger-icon">
              <span className={`burger-line ${isMobileSidebarOpen ? 'open' : ''}`}></span>
              <span className={`burger-line ${isMobileSidebarOpen ? 'open' : ''}`}></span>
              <span className={`burger-line ${isMobileSidebarOpen ? 'open' : ''}`}></span>
            </span>
          </button>

          <div className="header-title">
            <h1>{menuItems.find(item => item.id === currentView)?.label || 'Панель администратора'}</h1>
          </div>

          <div className="header-actions">
            <div className="user-profile">
              <div className="user-avatar">{adminName.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{adminName}</span>
                <span className="user-role">Администратор</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Выйти
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default AdminCabinet;