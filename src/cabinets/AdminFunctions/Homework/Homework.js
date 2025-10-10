import HomeworkList from "./HomeworkList"
import HomeworkAdd from "./HomeworkAdd"
import React, { useState } from 'react';
import '../AdminFunctions.css';

function Homework(){
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleHomeworkAdded = () => {
    setRefreshFlag(prev => !prev);
    setShowAddForm(false); // Скрываем форму после добавления
  };

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">📝 Домашние задания</h2>
          <p className="section-subtitle">Управление учебными материалами и заданиями</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          {showAddForm ? '✕ Отменить' : '+ Добавить задание'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ marginBottom: '30px' }}>
          <HomeworkAdd onHomeworkAdded={handleHomeworkAdded} />
        </div>
      )}

      {/* Homework List */}
      <HomeworkList refreshFlag={refreshFlag} />
    </div>
  );
}

export default Homework