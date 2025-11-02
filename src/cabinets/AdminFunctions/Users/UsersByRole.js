import React, { useState, useEffect } from "react";
import axios from "../../../api";
import UserCard from "./UserCard";
import { API_BASE_URL } from "../../../Config";
import '../AdminFunctions.css';

const roles = [
  { value: "student", label: "Студенты", icon: "👨‍🎓" },
  { value: "proctor", label: "Прокторы", icon: "👨‍🏫" },
  { value: "examinator", label: "Экзаменаторы", icon: "👨‍💼" },
  { value: "supervisor", label: "Супервизоры", icon: "👨‍💻" },
];

export default function UsersByRole() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 9;

  const fetchUsers = async (role) => {
    setSelectedRole(role);
    setUsers([]);
    setLoading(true);
    setCurrentPage(1); // Сбрасываем пагинацию при смене роли
    try {
      const response = await axios.post(`${API_BASE_URL}/api/get-users-by-role`, { role });
      setUsers(response.data.res || []);
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/delete-user`, {
        role: selectedRole,
        userId
      });
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
    }
  };

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Пагинация
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const selectedRoleData = roles.find(r => r.value === selectedRole);

  return (
    <div className="admin-section">
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">👥 Управление пользователями</h2>
        <p className="section-subtitle">Просмотр, поиск и управление пользователями системы</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        {/* Role Buttons */}
        <div className="button-group">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => fetchUsers(r.value)}
              className={`role-button ${selectedRole === r.value ? 'active' : ''}`}
            >
              <span style={{ marginRight: '8px' }}>{r.icon}</span>
              {r.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {selectedRole && (
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Поиск по имени..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Загрузка пользователей...</p>
        </div>
      )}

      {/* Content */}
      {!loading && selectedRole && (
        <>
          {/* Stats */}
          {filteredUsers.length > 0 && (
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Всего {selectedRoleData?.label.toLowerCase()}</p>
                <h3 className="stat-value">{users.length}</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Найдено</p>
                <h3 className="stat-value">{filteredUsers.length}</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">На странице</p>
                <h3 className="stat-value">{currentUsers.length}</h3>
              </div>
            </div>
          )}

          {/* Users Grid */}
          {currentUsers.length > 0 ? (
            <>
              <div className="cards-grid">
                {currentUsers.map(user => (
                  <UserCard
                    key={user.id} 
                    user={user} 
                    role={selectedRole}
                    roleIcon={selectedRoleData?.icon}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    ← Назад
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                  >
                    Вперед →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">Пользователи не найдены</h3>
              <p className="empty-text">
                {searchTerm 
                  ? `По запросу "${searchTerm}" ничего не найдено. Попробуйте изменить параметры поиска.`
                  : 'В этой категории пока нет пользователей.'
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Initial Empty State */}
      {!loading && !selectedRole && (
        <div className="empty-state">
          <div className="empty-icon">👆</div>
          <h3 className="empty-title">Выберите роль</h3>
          <p className="empty-text">Выберите роль пользователей для просмотра и управления</p>
        </div>
      )}
    </div>
  );
}