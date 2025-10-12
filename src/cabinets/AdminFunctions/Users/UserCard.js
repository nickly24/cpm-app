import { useState } from 'react';
import StudentEditModal from './StudentEditModal';
import '../AdminFunctions.css';

const UserCard = ({ user, role, roleIcon, onDelete, onUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${currentUser.full_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(currentUser.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEditSuccess = (updatedStudent) => {
    setCurrentUser(updatedStudent);
    if (onUpdate) {
      onUpdate(updatedStudent);
    }
  };

  // Получаем первую букву имени для аватара
  const initial = currentUser.full_name?.charAt(0).toUpperCase() || '?';

  // Определяем цвет в зависимости от роли
  const getRoleBadgeColor = () => {
    switch(role) {
      case 'student': return '#3498db';
      case 'proctor': return '#2ecc71';
      case 'examinator': return '#9b59b6';
      case 'supervisor': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  return (
    <>
      <div className="item-card">
        <div className="card-header">
          <div className="card-avatar">{initial}</div>
          <div className="card-info">
            <h3 className="card-title">{currentUser.full_name}</h3>
            <p className="card-subtitle">ID: {currentUser.id}</p>
          </div>
        </div>

        <div className="card-body">
          <div className="card-meta">
            <span className="meta-badge" style={{ background: getRoleBadgeColor() + '20', color: getRoleBadgeColor() }}>
              {roleIcon} {role === 'student' ? 'Студент' : 
                        role === 'proctor' ? 'Проктор' : 
                        role === 'examinator' ? 'Экзаменатор' : 'Супервизор'}
            </span>
            {currentUser.group_id && (
              <span className="meta-badge">
                🏫 Группа {currentUser.group_id}
              </span>
            )}
            {role === 'student' && currentUser.class && (
              <span className="meta-badge">
                🎓 {currentUser.class} класс
              </span>
            )}
            {role === 'student' && currentUser.tg_name && (
              <span className="meta-badge" style={{ background: '#0088cc20', color: '#0088cc' }}>
                💬 {currentUser.tg_name}
              </span>
            )}
          </div>
        </div>

        <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
          {role === 'student' && (
            <button 
              onClick={() => setShowEditModal(true)} 
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
            >
              ✏️ Редактировать
            </button>
          )}
          <button 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="btn btn-danger btn-sm"
            style={{ flex: role === 'student' ? 1 : undefined, width: role === 'student' ? 'auto' : '100%' }}
          >
            {isDeleting ? '🔄 Удаление...' : '🗑️ Удалить'}
          </button>
        </div>
      </div>

      {showEditModal && role === 'student' && (
        <StudentEditModal
          student={currentUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default UserCard;