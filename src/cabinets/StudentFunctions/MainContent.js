// MainContent.jsx
import { useState } from 'react';
import Homework from './Homework';
import Tests from './Tests';
import Progress from './Progress';
import Training from './Training';
import './MainContent.css';

const MainContent = () => {
  const [activeSection, setActiveSection] = useState(null);

  const handleBack = () => {
    setActiveSection(null);
  };

  return (
    <div className="main-container">
      {!activeSection ? (
        <div className="menu-container">
          <div 
            className="menu-item" 
            onClick={() => setActiveSection('homework')}
          >
            Домашка
          </div>
          <div 
            className="menu-item" 
            onClick={() => setActiveSection('tests')}
          >
            Тесты
          </div>
          <div 
            className="menu-item" 
            onClick={() => setActiveSection('progress')}
          >
            Успеваемость
          </div>
          {/*<div 
            className="menu-item training-item" 
            onClick={() => setActiveSection('training')}
          >
            ТРЕНИРОВКА
          </div>*/}
        </div>
      ) : (
        <>
          {activeSection === 'homework' && <Homework onBack={handleBack} />}
          {activeSection === 'tests' && <Tests onBack={handleBack} />}
          {activeSection === 'progress' && <Progress onBack={handleBack} />}
          {/*{activeSection === 'training' && <Training onBack={handleBack} />}*/}  
        </>
      )}
    </div>
  );
};

export default MainContent;