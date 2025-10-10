import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../Config';
import '../AdminFunctions.css';

const UnsignedUsers = ({ refreshFlag, onUpdate }) => {
  const [unassignedData, setUnassignedData] = useState({
    proctors: [],
    students: []
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState({});
  const [processingAssign, setProcessingAssign] = useState({
    proctors: {},
    students: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, groupsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/get-unsigned-proctors-students`),
          axios.get(`${API_BASE_URL}/api/get-groups`)
        ]);

        if (usersResponse.data?.status) {
          setUnassignedData({
            proctors: usersResponse.data.unassigned_proctors || [],
            students: usersResponse.data.unassigned_students || []
          });
        }

        if (groupsResponse.data?.status) {
          setGroups(groupsResponse.data.res || []);
        }
      } catch (err) {
        setError(err.message || 'Ошибка загрузки данных');
        console.error('Ошибка:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshFlag]);

  const handleGroupChange = (userId, type, value) => {
    setSelectedGroups(prev => ({
      ...prev,
      [`${type}_${userId}`]: value
    }));
  };

  const handleAssignProctor = async (proctorId) => {
    const groupId = selectedGroups[`proctor_${proctorId}`];
    if (!groupId) return setError('Выберите группу');

    try {
      setProcessingAssign(prev => ({
        ...prev,
        proctors: { ...prev.proctors, [proctorId]: true }
      }));
      
      await axios.post(
        `${API_BASE_URL}/api/change-group-proctor`,
        { proctorId, groupId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setUnassignedData(prev => ({
        ...prev,
        proctors: prev.proctors.filter(p => p.proctor_id !== proctorId)
      }));
      onUpdate();
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setProcessingAssign(prev => ({
        ...prev,
        proctors: { ...prev.proctors, [proctorId]: false }
      }));
    }
  };

  const handleAssignStudent = async (studentId) => {
    const groupId = selectedGroups[`student_${studentId}`];
    if (!groupId) return setError('Выберите группу');

    try {
      setProcessingAssign(prev => ({
        ...prev,
        students: { ...prev.students, [studentId]: true }
      }));
      
      await axios.post(
        `${API_BASE_URL}/api/change-group-student`,
        { studentId, groupId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setUnassignedData(prev => ({
        ...prev,
        students: prev.students.filter(s => s.student_id !== studentId)
      }));
      onUpdate();
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
      console.error('Ошибка:', err);
    } finally {
      setProcessingAssign(prev => ({
        ...prev,
        students: { ...prev.students, [studentId]: false }
      }));
    }
  };

  const totalUnassigned = unassignedData.proctors.length + unassignedData.students.length;

  if (loading) {
    return (
      <div className="loading-container" style={{ marginTop: '40px' }}>
        <div className="spinner"></div>
        <p className="loading-text">Загрузка непривязанных пользователей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ marginTop: '40px' }}>
        <div className="empty-icon">⚠️</div>
        <h3 className="empty-title">Ошибка загрузки</h3>
        <p className="empty-text">{error}</p>
      </div>
    );
  }

  if (totalUnassigned === 0) {
    return (
      <div className="empty-state" style={{ marginTop: '40px' }}>
        <div className="empty-icon">✅</div>
        <h3 className="empty-title">Все пользователи привязаны</h3>
        <p className="empty-text">Нет непривязанных прокторов или студентов</p>
      </div>
    );
  }

  return (
    <div className="admin-section" style={{ marginTop: '40px' }}>
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">⚠️ Непривязанные пользователи</h2>
        <p className="section-subtitle">Назначьте группы пользователям без привязки</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Всего непривязанных</p>
          <h3 className="stat-value">{totalUnassigned}</h3>
        </div>
        <div className="stat-card">
          <p className="stat-label">Прокторов</p>
          <h3 className="stat-value">{unassignedData.proctors.length}</h3>
        </div>
        <div className="stat-card">
          <p className="stat-label">Студентов</p>
          <h3 className="stat-value">{unassignedData.students.length}</h3>
        </div>
      </div>

      {/* Users Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Proctors Card */}
        {unassignedData.proctors.length > 0 && (
          <div className="item-card">
            <div className="card-header">
              <div className="card-avatar" style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' }}>
                👨‍🏫
              </div>
              <div className="card-info">
                <h3 className="card-title">Прокторы без группы</h3>
                <p className="card-subtitle">{unassignedData.proctors.length} человек</p>
              </div>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {unassignedData.proctors.map(proctor => (
                  <div key={proctor.proctor_id} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                        {proctor.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        ID: {proctor.proctor_id}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={selectedGroups[`proctor_${proctor.proctor_id}`] || ''}
                        onChange={(e) => handleGroupChange(proctor.proctor_id, 'proctor', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '2px solid #e8ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Montserrat, sans-serif',
                          background: 'white'
                        }}
                      >
                        <option value="" disabled>Выберите группу</option>
                        {groups.map(group => (
                          <option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignProctor(proctor.proctor_id)}
                        className="btn btn-success btn-sm"
                        disabled={processingAssign.proctors[proctor.proctor_id]}
                      >
                        {processingAssign.proctors[proctor.proctor_id] ? '🔄' : '✓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Students Card */}
        {unassignedData.students.length > 0 && (
          <div className="item-card">
            <div className="card-header">
              <div className="card-avatar" style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}>
                👨‍🎓
              </div>
              <div className="card-info">
                <h3 className="card-title">Студенты без группы</h3>
                <p className="card-subtitle">{unassignedData.students.length} человек</p>
              </div>
            </div>

            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                {unassignedData.students.map(student => (
                  <div key={student.student_id} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '2px' }}>
                        {student.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        ID: {student.student_id}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={selectedGroups[`student_${student.student_id}`] || ''}
                        onChange={(e) => handleGroupChange(student.student_id, 'student', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '2px solid #e8ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Montserrat, sans-serif',
                          background: 'white'
                        }}
                      >
                        <option value="" disabled>Выберите группу</option>
                        {groups.map(group => (
                          <option key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignStudent(student.student_id)}
                        className="btn btn-success btn-sm"
                        disabled={processingAssign.students[student.student_id]}
                      >
                        {processingAssign.students[student.student_id] ? '🔄' : '✓'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(UnsignedUsers);