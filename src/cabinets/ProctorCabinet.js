import React, { useState } from 'react';
import StudentList from './ProctorsFunctions/StudentList';
import HomeworkList from './ProctorsFunctions/HomeworkList';
import OVTable from './ProctorsFunctions/OVTable';
import './ProctorCabinet.css';
import { ReactComponent as Logo } from './logo.svg';
import { useAuth } from '../AuthContext';

const ProctorCabinet = () => {
  const { user, logout } = useAuth();
  const fullName = user?.full_name || 'Проктор';
  const groupId = user?.group_id;
  const [showStudents, setShowStudents] = useState(false);
  const [currentView, setCurrentView] = useState('homework');

  const handleLogout = async () => {
    await logout();
  };

  const toggleStudents = () => {
    setShowStudents(!showStudents);
  };

  return (
    <div className="cabinet">
      <header className="cabinet-header">
        <div><Logo/><h3>Личный кабинет проктора</h3></div>
        <div className="user-inf">
          <div><span>Добро пожаловать, {fullName}!</span></div>
          <button onClick={handleLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </header>
      
      <main className="cabinet-content">
        {/* Навигация */}
        <div className="proctor-nav">
          <button
            className={`nav-btn ${currentView === 'homework' ? 'active' : ''}`}
            onClick={() => setCurrentView('homework')}
          >
            📝 Домашние задания
          </button>
          <button
            className={`nav-btn ${currentView === 'ov-table' ? 'active' : ''}`}
            onClick={() => setCurrentView('ov-table')}
          >
            📋 Таблица ОВ
          </button>
        </div>

        {currentView === 'homework' && (
          <>
            <div className="students-section">
              <button 
                onClick={toggleStudents}
                className="toggle-students-btn"
              >
                {showStudents ? 'Скрыть список студентов' : 'Показать список студентов'}
                <span className={`toggle-icon ${showStudents ? 'open' : ''}`}>▼</span>
              </button>
              
              <div className={`students-container ${showStudents ? 'visible' : ''}`}>
                <StudentList groupId={groupId} />
              </div>
            </div>
            
            <HomeworkList />
          </>
        )}

        {currentView === 'ov-table' && (
          <OVTable />
        )}
      </main>
    </div>
  );
};

export default ProctorCabinet;