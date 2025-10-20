import React, { useState } from 'react';
import TestResultsView from '../Tests/TestResultsView';
import HomeworkResults from './HomeworkResults';
import './ResultsView.css';

const ResultsView = () => {
  const [activeTab, setActiveTab] = useState('tests');

  const tabs = [
    { id: 'tests', label: 'Результаты тестов', icon: '📊' },
    { id: 'homework', label: 'Домашние задания', icon: '📝' }
  ];

  return (
    <div className="results-view-container">
      <div className="results-view-header">
        <h2 className="results-view-title">Результаты обучения</h2>
        <p className="results-view-subtitle">
          Анализ успеваемости студентов по тестам и домашним заданиям
        </p>
      </div>

      <div className="results-view-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`results-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="results-view-content">
        {activeTab === 'tests' && <TestResultsView />}
        {activeTab === 'homework' && <HomeworkResults />}
      </div>
    </div>
  );
};

export default ResultsView;
