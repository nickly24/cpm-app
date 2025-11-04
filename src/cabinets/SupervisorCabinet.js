import React, { useState, useEffect } from 'react';
import Ratings from './AdminFunctions/Ratings/Ratings';
import OVTable from './ProctorsFunctions/OVTable';
import { ReactComponent as Logo } from './logo.svg';
import './SupervisorCabinet.css';
import { useAuth } from '../AuthContext';

const SupervisorCabinet = () => {
  const hash = window.location.hash.substring(1);
  const [currentView, setCurrentView] = useState(hash || 'ratings');
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
  const supervisorName = user?.full_name || 'Супервайзер';
  
  useEffect(() => {
    if (currentView === 'ratings') {
      window.location.hash = '';
    } else {
      window.location.hash = currentView;
    }
  }, [currentView]);

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { id: 'ratings', label: 'Рейтинг', icon: '🏆', description: 'Рейтинги студентов' },
    { id: 'homework-table', label: 'Таблица ОВ', icon: '📋', description: 'Таблица обязательных работ' },
    { id: 'attendance', label: 'Посещаемость', icon: '📅', description: 'Посещаемость студентов' },
  ];

  const handleMenuClick = (viewId) => {
    setCurrentView(viewId);
    setIsMobileSidebarOpen(false);
  };

  const renderView = () => {
    switch(currentView) {
      case 'ratings':
        return <Ratings />;
      case 'homework-table':
        return <OVTable />;
      case 'attendance':
        return (
          <div className="supervisor-placeholder">
            <h2>📅 Посещаемость</h2>
            <p>Раздел в разработке</p>
          </div>
        );
      default:
        return <Ratings />;
    }
  };

  return (
    <div className="supervisor-layout">
      {/* Sidebar */}
      <aside className={`supervisor-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Logo />
            {!isSidebarCollapsed && <span className="logo-text">CPM Supervisor</span>}
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
      <div className="supervisor-main">
        {/* Header */}
        <header className="supervisor-header">
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
            <h1>{menuItems.find(item => item.id === currentView)?.label || 'Панель супервайзера'}</h1>
          </div>

          <div className="header-actions">
            <div className="user-profile">
              <div className="user-avatar">{supervisorName.charAt(0).toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{supervisorName}</span>
                <span className="user-role">Супервайзер</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Выйти
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="supervisor-content">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default SupervisorCabinet;
