import { useState } from 'react';
import '../AdminFunctions.css';

const UserCard = ({ user, role, roleIcon, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${user.full_name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(user.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Получаем первую букву имени для аватара
  const initial = user.full_name?.charAt(0).toUpperCase() || '?';

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
    <div className="item-card">
      <div className="card-header">
        <div className="card-avatar">{initial}</div>
        <div className="card-info">
          <h3 className="card-title">{user.full_name}</h3>
          <p className="card-subtitle">ID: {user.id}</p>
        </div>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <span className="meta-badge" style={{ background: getRoleBadgeColor() + '20', color: getRoleBadgeColor() }}>
            {roleIcon} {role === 'student' ? 'Студент' : 
                      role === 'proctor' ? 'Проктор' : 
                      role === 'examinator' ? 'Экзаменатор' : 'Супервизор'}
          </span>
          {user.group_id && (
            <span className="meta-badge">
              🏫 Группа {user.group_id}
            </span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="btn btn-danger btn-sm"
          style={{ width: '100%' }}
        >
          {isDeleting ? '🔄 Удаление...' : '🗑️ Удалить'}
        </button>
      </div>
    </div>
  );
};

export default UserCard;