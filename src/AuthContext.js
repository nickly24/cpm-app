import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from './api';
import { API_BASE_URL } from './Config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверка авторизации при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  // Проверка авторизации
  const checkAuth = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/aun`);
      
      if (response.data.status) {
        setUser({
          role: response.data.role,
          entity_id: response.data.entity_id,
          full_name: response.data.full_name,
          group_id: response.data.group_id,
          id: response.data.entity_id
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Вход
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth`, {
        login: username,
        password: password
      });

      if (response.data.status) {
        // Сохраняем токен в localStorage
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        
        // Устанавливаем данные пользователя
        setUser({
          role: response.data.user.role,
          entity_id: response.data.user.id,
          full_name: response.data.user.full_name,
          group_id: response.data.user.group_id,
          id: response.data.user.id
        });
        
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.data.message || 'Ошибка входа' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка входа' 
      };
    }
  };

  // Выход
  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Удаляем токен из localStorage
      localStorage.removeItem('auth_token');
      // Очищаем пользователя
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

