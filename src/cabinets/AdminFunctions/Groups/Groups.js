import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';

const Groups = ({ refreshFlag, onUpdate }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingProctors, setProcessingProctors] = useState({});
  const [processingStudents, setProcessingStudents] = useState({});
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setProgress(0);
        setLoading(true);
        
        // Имитация прогресса загрузки
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev + Math.random() * 3;
            return newProgress > 90 ? 90 : newProgress;
          });
        }, 300);

        const response = await axios.get(`${API_BASE_URL}/api/get-groups-students`);
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Небольшая задержка для завершения анимации
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (Array.isArray(response.data)) {
          setGroups(response.data);
        } else {
          throw new Error('Неверный формат данных');
        }
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных о группах');
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [refreshFlag]);

  // Остальные функции handleRemoveProctor и handleRemoveStudent остаются без изменений
  const handleRemoveProctor = async (groupId, proctorId, proctorData) => {
    try {
      setProcessingProctors(prev => ({ ...prev, [proctorId]: true }));
      
      const response = await axios.post(
        `${API_BASE_URL}/api/remove-groupd-id-proctor`,
        { proctorId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status) {
        setGroups(prev => prev.map(group => 
          group.item.group_id === groupId
            ? { ...group, proctor: { status: false, res: null } }
            : group
        ));
        onUpdate();
      }
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setProcessingProctors(prev => ({ ...prev, [proctorId]: false }));
    }
  };

  const handleRemoveStudent = async (groupId, studentId, studentData) => {
    try {
      setProcessingStudents(prev => ({ ...prev, [studentId]: true }));
      
      const response = await axios.post(
        `${API_BASE_URL}/api/remove-groupd-id-student`,
        { studentId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status) {
        setGroups(prev => prev.map(group => 
          group.item.group_id === groupId
            ? { 
                ...group, 
                students: group.students.filter(s => s.id !== studentId) 
              }
            : group
        ));
        onUpdate();
      }
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setProcessingStudents(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Фильтрация групп по поиску
  const filteredGroups = groups.filter(group => 
    group.item.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.item.group_id.toString().includes(searchTerm)
  );

  // Подсчет статистики
  const totalStudents = groups.reduce((sum, group) => sum + group.students.length, 0);
  const groupsWithProctors = groups.filter(g => g.proctor.status && g.proctor.res).length;

  if (error) {
    return (
      <div className="admin-section">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3 className="empty-title">Ошибка загрузки</h3>
          <p className="empty-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">🏫 Управление группами</h2>
        <p className="section-subtitle">Просмотр групп, прокторов и студентов</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Загрузка данных о группах...</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Всего групп</p>
              <h3 className="stat-value">{groups.length}</h3>
            </div>
            <div className="stat-card">
              <p className="stat-label">Всего студентов</p>
              <h3 className="stat-value">{totalStudents}</h3>
            </div>
            <div className="stat-card">
              <p className="stat-label">С прокторами</p>
              <h3 className="stat-value">{groupsWithProctors}</h3>
            </div>
          </div>

          {/* Search */}
          <div className="filters-section">
            <div className="search-container">
              <input
                type="text"
                placeholder="🔍 Поиск группы по названию или ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">Группы не найдены</h3>
              <p className="empty-text">
                {searchTerm 
                  ? `По запросу "${searchTerm}" ничего не найдено.`
                  : 'Нет доступных групп в системе.'
                }
              </p>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredGroups.map(group => (
                <div key={group.item.group_id} className="item-card">
                  {/* Group Header */}
                  <div className="card-header">
                    <div className="card-avatar" style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                      🏫
                    </div>
                    <div className="card-info">
                      <h3 className="card-title">{group.item.group_name}</h3>
                      <p className="card-subtitle">ID: {group.item.group_id}</p>
                    </div>
                  </div>

                  {/* Proctor Section */}
                  <div className="card-body">
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', marginBottom: '8px' }}>
                        👨‍🏫 Проктор:
                      </div>
                      {group.proctor.status && group.proctor.res ? (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                              {group.proctor.res.full_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                              ID: {group.proctor.res.proctor_id}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveProctor(
                              group.item.group_id, 
                              group.proctor.res.proctor_id,
                              group.proctor.res
                            )}
                            className="btn btn-danger btn-sm"
                            disabled={processingProctors[group.proctor.res.proctor_id]}
                          >
                            {processingProctors[group.proctor.res.proctor_id] ? '🔄' : '🗑️'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '12px', 
                          background: '#fff3cd', 
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#856404'
                        }}>
                          Проктор не назначен
                        </div>
                      )}
                    </div>

                    {/* Students Section */}
                    <div>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: '#4a5568', 
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>👨‍🎓 Студенты:</span>
                        <span className="meta-badge">{group.students.length}</span>
                      </div>
                      {group.students.length > 0 ? (
                        <div style={{ 
                          maxHeight: '200px', 
                          overflowY: 'auto',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          padding: '8px'
                        }}>
                          {group.students.map(student => (
                            <div key={student.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px',
                              background: 'white',
                              borderRadius: '6px',
                              marginBottom: '6px',
                              fontSize: '13px'
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: '500', color: '#2c3e50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {student.full_name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                                  ID: {student.id}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(
                                  group.item.group_id, 
                                  student.id,
                                  student
                                )}
                                className="btn btn-danger btn-sm"
                                disabled={processingStudents[student.id]}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                {processingStudents[student.id] ? '🔄' : '🗑️'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          padding: '12px', 
                          background: '#f8f9fa', 
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#7f8c8d',
                          textAlign: 'center'
                        }}>
                          В группе нет студентов
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(Groups);