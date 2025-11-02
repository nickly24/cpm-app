import React, { useState, useEffect } from 'react';
import axios from '../../../api';
import { API_BASE_URL } from '../../../Config';
import './HomeworkResults.css';

const HomeworkResults = () => {
  const [homeworkData, setHomeworkData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [expandedHomework, setExpandedHomework] = useState(null);
  const [studentsData, setStudentsData] = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentStatusFilter, setStudentStatusFilter] = useState({}); // { [homeworkId]: 'all' | 'submitted' | 'overdue' | 'not_submitted' }
  const [studentNameSearch, setStudentNameSearch] = useState({}); // { [homeworkId]: 'query' }
  const [adminEditState, setAdminEditState] = useState({
    datePass: '',
    submitting: false,
    editingStudentForPass: null, // { homeworkId, student }
    editingStudentSubmitted: null // { homeworkId, student }
  });
  
  // Фильтры
  const [filters, setFilters] = useState({
    status: 'all', // all, submitted, overdue, in_progress, not_started
    group: 'all',
    homeworkType: 'all',
    scoreRange: 'all', // all, high (80+), medium (50-79), low (0-49)
    dateRange: 'all', // all, this_week, this_month, overdue_only
    searchTerm: ''
  });
  
  // Пагинация (удалено - теперь используется pagination объект)
  
  // Статистика
  const [stats, setStats] = useState({
    totalHomeworks: 0,
    totalStudents: 0,
    averageScore: 0,
    overdueCount: 0,
    submittedCount: 0
  });

  // Загрузка данных
  useEffect(() => {
    fetchHomeworkData();
  }, [pagination.currentPage, pagination.itemsPerPage, filters]);

  // Применение фильтров при изменении данных (без сброса текущей страницы)
  useEffect(() => {
    if (homeworkData.length > 0) {
      applyFilters();
    }
  }, [homeworkData]);

  // Применение фильтров при изменении фильтров (со сбросом на 1 страницу)
  useEffect(() => {
    applyFilters();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters]);

  const fetchHomeworkData = async () => {
    try {
      setLoading(true);
      
      // Подготавливаем фильтры для API
      const apiFilters = {};
      if (filters.homeworkType !== 'all') {
        apiFilters.homework_type = filters.homeworkType;
      }
      if (filters.dateRange === 'overdue_only') {
        apiFilters.status = 'overdue_only';
      }
      
      let response;
      try {
        // Пробуем новый API с пагинацией
        response = await axios.post(`${API_BASE_URL}/api/get-homework-results-paginated`, {
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          filters: apiFilters
        });
        console.log('API Response (paginated):', response.data);
      } catch (apiError) {
        console.warn('Новый API недоступен, используем старый:', apiError.message);
        // Fallback на старый API
        response = await axios.get(`${API_BASE_URL}/api/get-all-homework-results`);
        console.log('API Response (fallback):', response.data);
      }
      
      if (response.data?.status && Array.isArray(response.data?.res)) {
        setHomeworkData(response.data.res);
        
        // Если есть пагинация, используем её, иначе создаем дефолтную
        if (response.data.pagination) {
          const p = response.data.pagination;
          setPagination(prev => ({
            ...prev,
            currentPage: p.current_page ?? prev.currentPage,
            totalPages: p.total_pages ?? prev.totalPages,
            totalItems: p.total_items ?? prev.totalItems,
            itemsPerPage: p.items_per_page ?? prev.itemsPerPage
          }));
        } else {
          // Для старого API создаем дефолтную пагинацию
          setPagination(prev => ({
            ...prev,
            totalPages: 1,
            totalItems: response.data.res.length,
            currentPage: 1
          }));
        }
        
        calculateStats(response.data.res);
      } else {
        console.error('Неверный формат данных:', response.data);
        throw new Error('Неверный формат данных');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalHomeworks = data.length;
    let totalSessions = 0;
    let submittedCount = 0;
    let overdueCount = 0;
    const submittedScores = [];

    data.forEach(hw => {
      const students = (studentsData[hw.homework_id] && studentsData[hw.homework_id].length > 0) ? studentsData[hw.homework_id] : (hw.students || []);
      const total = students.length;
      const submitted = students.filter(s => s.status === 1 || s.status_text === 'Сдано');
      const deadlinePassed = new Date(hw.deadline) < new Date();
      const overdue = deadlinePassed ? Math.max(total - submitted.length, 0) : 0;

      totalSessions += total;
      submittedCount += submitted.length;
      overdueCount += overdue;
      submitted.forEach(s => { if (s.result != null) submittedScores.push(Number(s.result)); });
    });

    const averageScore = submittedScores.length ? Math.round(submittedScores.reduce((a,b)=>a+b,0) / submittedScores.length) : 0;

    setStats({
      totalHomeworks,
      totalStudents: totalSessions,
      averageScore,
      overdueCount,
      submittedCount
    });
  };

  const applyFilters = () => {
    let filtered = [...homeworkData];

    // Фильтр по статусу
    if (filters.status !== 'all') {
      filtered = filtered.map(hw => ({
        ...hw,
        students: hw.students.filter(student => {
          switch (filters.status) {
            case 'submitted': return student.status === 1;
            case 'overdue': return student.status_text === 'Просрочено';
            case 'in_progress': return student.status_text === 'В процессе';
            case 'not_started': return student.status_text === 'Не начато';
            default: return true;
          }
        })
      })).filter(hw => hw.students.length > 0);
    }

    // Фильтр по группе
    if (filters.group !== 'all') {
      filtered = filtered.map(hw => ({
        ...hw,
        students: hw.students.filter(student => student.group_name === filters.group)
      })).filter(hw => hw.students.length > 0);
    }

    // Фильтр по типу задания
    if (filters.homeworkType !== 'all') {
      filtered = filtered.filter(hw => hw.homework_type === filters.homeworkType);
    }

    // Фильтр по диапазону баллов
    if (filters.scoreRange !== 'all') {
      filtered = filtered.map(hw => ({
        ...hw,
        students: hw.students.filter(student => {
          if (!student.result) return false;
          switch (filters.scoreRange) {
            case 'high': return student.result >= 80;
            case 'medium': return student.result >= 50 && student.result < 80;
            case 'low': return student.result < 50;
            default: return true;
          }
        })
      })).filter(hw => hw.students.length > 0);
    }

    // Фильтр по дате
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(hw => {
        const deadline = new Date(hw.deadline);
        switch (filters.dateRange) {
          case 'this_week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return deadline >= weekAgo;
          case 'this_month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return deadline >= monthAgo;
          case 'overdue_only':
            return deadline < now;
          default: return true;
        }
      });
    }

    // Поиск по названию
    if (filters.searchTerm) {
      filtered = filtered.filter(hw => 
        hw.homework_name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      group: 'all',
      homeworkType: 'all',
      scoreRange: 'all',
      dateRange: 'all',
      searchTerm: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const loadStudentsForHomework = async (homeworkId) => {
    if (studentsData[homeworkId]) {
      return; // Уже загружены
    }

    try {
      setLoadingStudents(true);
      const response = await axios.post(`${API_BASE_URL}/api/get-homework-students`, {
        homework_id: homeworkId,
        page: 1,
        limit: 5000 // Загружаем всех студентов для конкретного задания без фильтров
      });

      if (response.data?.status && Array.isArray(response.data?.res)) {
        setStudentsData(prev => ({
          ...prev,
          [homeworkId]: response.data.res
        }));
      }
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleHomeworkExpansion = (homeworkId) => {
    if (expandedHomework === homeworkId) {
      setExpandedHomework(null);
    } else {
      setExpandedHomework(homeworkId);
      // Инициализируем локальный список, чтобы дальнейшие правки
      // обновляли один и тот же источник данных
      if (!studentsData[homeworkId]) {
        const base = (homeworkData.find(h => h.homework_id === homeworkId)?.students) || [];
        if (base.length > 0) {
          setStudentsData(prev => ({ ...prev, [homeworkId]: base }));
        }
      }
      loadStudentsForHomework(homeworkId);
    }
  };

  const getStudentsList = (homework) => {
    return (studentsData[homework.homework_id] && studentsData[homework.homework_id].length > 0)
      ? studentsData[homework.homework_id]
      : (homework.students || []);
  };

  const computeHomeworkStats = (homework) => {
    const students = getStudentsList(homework);
    const totalStudents = students.length;
    const submitted = students.filter(s => s.status === 1 || s.status_text === 'Сдано').length;
    const deadlinePassed = new Date(homework.deadline) < new Date();
    // Просрочено = все, кто НЕ сдал после дедлайна
    const overdue = deadlinePassed ? Math.max(totalStudents - submitted, 0) : 0;
    const avgScores = students
      .filter(s => (s.status === 1 || s.status_text === 'Сдано') && s.result != null)
      .map(s => Number(s.result));
    const averageScore = avgScores.length
      ? Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length)
      : 0;
    return { totalStudents, submitted, overdue, averageScore };
  };

  const getFilteredStudentsForHomework = (homework) => {
    const list = getStudentsList(homework);
    const filterValue = studentStatusFilter[homework.homework_id] || 'all';
    const nameQuery = (studentNameSearch[homework.homework_id] || '').trim().toLowerCase();

    let filtered = list;
    if (filterValue !== 'all') {
      filtered = filtered.filter(st => {
        switch (filterValue) {
          case 'submitted': return st.status === 1 || st.status_text === 'Сдано';
          case 'overdue': {
            const { totalStudents } = computeHomeworkStats(homework);
            if (totalStudents === 0) return false;
            return !(st.status === 1 || st.status_text === 'Сдано');
          }
          case 'not_submitted': return !(st.status === 1 || st.status_text === 'Сдано');
          default: return true;
        }
      });
    }

    if (nameQuery) {
      filtered = filtered.filter(st => (st.student_name || '').toLowerCase().includes(nameQuery));
    }

    return filtered;
  };

  const buildStatusChips = (homework) => {
    const deadlinePassed = new Date(homework.deadline) < new Date();
    const chips = [
      { key: 'all', label: 'Все' },
      { key: 'submitted', label: 'Сдано' }
    ];
    if (deadlinePassed) {
      chips.push({ key: 'overdue', label: 'Просрочено' });
    } else {
      chips.push({ key: 'not_submitted', label: 'Не сдано' });
    }
    return chips;
  };

  const openPassForm = (homeworkId, student) => {
    setAdminEditState(prev => ({ ...prev, editingStudentForPass: { homeworkId, student }, editingStudentSubmitted: null, datePass: '' }));
  };

  const openEditForm = (homeworkId, student) => {
    const existingDate = student.date_pass ? new Date(student.date_pass).toISOString().slice(0,10) : '';
    setAdminEditState(prev => ({ ...prev, editingStudentSubmitted: { homeworkId, student }, editingStudentForPass: null, datePass: existingDate }));
  };

  const cancelEdit = () => {
    setAdminEditState({ datePass: '', submitting: false, editingStudentForPass: null, editingStudentSubmitted: null });
  };

  const handleAdminPassHomework = async () => {
    const { editingStudentForPass, datePass } = adminEditState;
    if (!editingStudentForPass || !datePass) return;
    const { homeworkId, student } = editingStudentForPass;
    try {
      setAdminEditState(prev => ({ ...prev, submitting: true }));
      const response = await axios.post(`${API_BASE_URL}/api/pass_homework`, {
        sessionId: student.session_id || null,
        datePass: datePass,
        studentId: student.student_id,
        homeworkId: homeworkId
      }, { headers: { 'Content-Type': 'application/json' } });

      const resultScore = response.data?.result != null ? response.data.result : (student.result || 100);
      // Обновляем локальные источники: studentsData и homeworkData
      setStudentsData(prev => {
        const current = prev[homeworkId] || (homeworkData.find(h => h.homework_id === homeworkId)?.students || []);
        const updated = current.map(s => s.student_id === student.student_id ? {
          ...s,
          status: 1,
          status_text: 'Сдано',
          date_pass: datePass,
          result: resultScore,
          session_id: s.session_id || response.data?.session_id || s.session_id
        } : s);
        return { ...prev, [homeworkId]: updated };
      });

      setHomeworkData(prev => prev.map(hw => hw.homework_id === homeworkId ? {
        ...hw,
        students: hw.students.map(s => s.student_id === student.student_id ? {
          ...s,
          status: 1,
          status_text: 'Сдано',
          date_pass: datePass,
          result: resultScore
        } : s)
      } : hw));

      cancelEdit();
    } catch (err) {
      console.error('Ошибка при занесении ДЗ админом:', err);
    } finally {
      setAdminEditState(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleAdminEditHomework = async () => {
    const { editingStudentSubmitted, datePass } = adminEditState;
    if (!editingStudentSubmitted || !datePass) return;
    const { homeworkId, student } = editingStudentSubmitted;
    try {
      setAdminEditState(prev => ({ ...prev, submitting: true }));
      await axios.post(`${API_BASE_URL}/api/edit-homework-session`, {
        sessionId: student.session_id,
        datePass: datePass,
        status: 1
      }, { headers: { 'Content-Type': 'application/json' } });

      // Обновляем локальные источники: studentsData и homeworkData
      setStudentsData(prev => {
        const current = prev[homeworkId] || (homeworkData.find(h => h.homework_id === homeworkId)?.students || []);
        const updated = current.map(s => s.student_id === student.student_id ? { ...s, date_pass: datePass, status: 1, status_text: 'Сдано' } : s);
        return { ...prev, [homeworkId]: updated };
      });

      setHomeworkData(prev => prev.map(hw => hw.homework_id === homeworkId ? {
        ...hw,
        students: hw.students.map(s => s.student_id === student.student_id ? { ...s, date_pass: datePass, status: 1, status_text: 'Сдано' } : s)
      } : hw));

      cancelEdit();
    } catch (err) {
      console.error('Ошибка при редактировании ДЗ админом:', err);
    } finally {
      setAdminEditState(prev => ({ ...prev, submitting: false }));
    }
  };

  const exportToExcel = async () => {
    // Подготавливаем данные для экспорта
    // Если есть несколько страниц, пробуем забрать все данные старым эндпоинтом
    let sourceData = filteredData;
    if (pagination.totalPages > 1) {
      try {
        const resp = await axios.get(`${API_BASE_URL}/api/get-all-homework-results`);
        if (resp.data?.status && Array.isArray(resp.data?.res)) {
          sourceData = resp.data.res;
        }
      } catch (e) {
        // fallback оставляем sourceData = filteredData
      }
    }

    const exportData = [];
    
    sourceData.forEach(homework => {
      homework.students.forEach(student => {
        exportData.push({
          'Название задания': homework.homework_name,
          'Тип задания': homework.homework_type,
          'Дедлайн': formatDate(homework.deadline),
          'Студент': student.student_name,
          'Группа': student.group_name || 'Не указана',
          'Класс': student.student_class || 'Не указан',
          'Статус': student.status_text,
          'Баллы': student.result || 0,
          'Дата сдачи': student.date_pass ? formatDate(student.date_pass) : 'Не сдано',
          'Дней просрочки': student.days_overdue || 0
        });
      });
    });

    // Создаем CSV файл
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Создаем и скачиваем файл
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `homework_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUniqueGroups = () => {
    const groups = new Set();
    homeworkData.forEach(hw => {
      hw.students.forEach(student => {
        if (student.group_name) groups.add(student.group_name);
      });
    });
    return Array.from(groups).sort();
  };

  const getUniqueHomeworkTypes = () => {
    const types = new Set();
    homeworkData.forEach(hw => {
      if (hw.homework_type) types.add(hw.homework_type);
    });
    return Array.from(types).sort();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Сдано': return '#28a745';
      case 'Просрочено': return '#dc3545';
      case 'В процессе': return '#ffc107';
      case 'Не начато': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getScoreColor = (score) => {
    if (!score) return '#6c757d';
    if (score >= 80) return '#28a745';
    if (score >= 50) return '#ffc107';
    return '#dc3545';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Пагинация
  const { totalPages, currentPage } = pagination;

  if (loading) {
    return (
      <div className="homework-results-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных о домашних заданиях...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homework-results-error">
        <p>❌ {error}</p>
        <button onClick={fetchHomeworkData} className="retry-button">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="homework-results-container">
      {/* Статистические карточки */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalHomeworks}</div>
            <div className="stat-label">Всего заданий</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Всего ДЗ‑сессий</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.averageScore}</div>
            <div className="stat-label">Средний балл</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.submittedCount}</div>
            <div className="stat-label">Сдано заданий</div>
          </div>
        </div>
        
        <div className="stat-card overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.overdueCount}</div>
            <div className="stat-label">Просрочено</div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Фильтры и поиск</h3>
          <div className="filters-actions">
            <button onClick={exportToExcel} className="export-btn">
              📊 Экспорт в Excel
            </button>
            <button onClick={clearFilters} className="clear-filters-btn">
              Очистить фильтры
            </button>
          </div>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Статус</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="submitted">Сдано</option>
              <option value="overdue">Просрочено</option>
              <option value="in_progress">В процессе</option>
              <option value="not_started">Не начато</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Группа</label>
            <select 
              value={filters.group} 
              onChange={(e) => handleFilterChange('group', e.target.value)}
            >
              <option value="all">Все группы</option>
              {getUniqueGroups().map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Тип задания</label>
            <select 
              value={filters.homeworkType} 
              onChange={(e) => handleFilterChange('homeworkType', e.target.value)}
            >
              <option value="all">Все типы</option>
              {getUniqueHomeworkTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Диапазон баллов</label>
            <select 
              value={filters.scoreRange} 
              onChange={(e) => handleFilterChange('scoreRange', e.target.value)}
            >
              <option value="all">Все баллы</option>
              <option value="high">80+ баллов</option>
              <option value="medium">50-79 баллов</option>
              <option value="low">0-49 баллов</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Период</label>
            <select 
              value={filters.dateRange} 
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">Все периоды</option>
              <option value="this_week">Эта неделя</option>
              <option value="this_month">Этот месяц</option>
              <option value="overdue_only">Только просроченные</option>
            </select>
          </div>
          
          <div className="filter-group search-group">
            <label>Поиск по названию</label>
            <input
              type="text"
              placeholder="Введите название задания..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Результаты */}
      <div className="results-section">
        <div className="results-header">
          <h3>Результаты домашних заданий</h3>
          <div className="results-count">
            Показано: {homeworkData.length} из {pagination.totalItems} заданий
            (страница {pagination.currentPage} из {pagination.totalPages})
          </div>
        </div>
        <div className="results-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>На странице:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => setPagination(prev => ({ ...prev, itemsPerPage: parseInt(e.target.value, 10), currentPage: 1 }))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {homeworkData.length === 0 ? (
          <div className="no-results">
            <p>Нет данных, соответствующих выбранным фильтрам</p>
          </div>
        ) : (
          <div className="homework-list">
            {homeworkData.map(homework => (
              <div key={homework.homework_id} className="homework-card">
                <div className="homework-header">
                  <div className="homework-title">
                    <h4>{homework.homework_name}</h4>
                    <span className="homework-type">{homework.homework_type}</span>
                  </div>
                  <div className="homework-deadline">
                    Дедлайн: {formatDate(homework.deadline)}
                  </div>
                </div>
                
                {(() => { const s = computeHomeworkStats(homework); return (
                <div className="homework-stats">
                  <div className="stat-item">
                    <span className="stat-label">Всего студентов:</span>
                    <span className="stat-value">{s.totalStudents}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Сдано:</span>
                    <span className="stat-value success">{s.submitted}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Просрочено:</span>
                    <span className="stat-value danger">{s.overdue}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Средний балл:</span>
                    <span className="stat-value">{s.averageScore}</span>
                  </div>
                </div>
                ); })()}

                <div className="homework-actions">
                  <button 
                    onClick={() => toggleHomeworkExpansion(homework.homework_id)}
                    className="expand-btn"
                  >
                    {expandedHomework === homework.homework_id ? 'Скрыть студентов' : 'Показать студентов'}
                    {expandedHomework === homework.homework_id ? ' ▲' : ' ▼'}
                  </button>
                </div>

                {expandedHomework === homework.homework_id && (
                  <div className="students-list">
                    <h5>Студенты:</h5>
                    <div className="status-chips">
                      {buildStatusChips(homework).map(f => (
                        <button
                          key={f.key}
                          onClick={() => setStudentStatusFilter(prev => ({ ...prev, [homework.homework_id]: f.key }))}
                          className={`chip ${ (studentStatusFilter[homework.homework_id] || 'all') === f.key ? 'active' : ''}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="student-search">
                      <input
                        type="text"
                        placeholder="Поиск по имени студента..."
                        value={studentNameSearch[homework.homework_id] || ''}
                        onChange={(e) => setStudentNameSearch(prev => ({ ...prev, [homework.homework_id]: e.target.value }))}
                      />
                    </div>
                    {loadingStudents ? (
                      <div className="loading-students">
                        <div className="loading-spinner"></div>
                        <p>Загрузка студентов...</p>
                      </div>
                    ) : (
                      <div className="students-grid">
                        {getFilteredStudentsForHomework(homework).map(student => {
                          const isSubmitted = student.status === 1 || student.status_text === 'Сдано';
                          const isEditingSubmitted = adminEditState.editingStudentSubmitted?.student?.student_id === student.student_id && adminEditState.editingStudentSubmitted?.homeworkId === homework.homework_id;
                          const isEditingPass = adminEditState.editingStudentForPass?.student?.student_id === student.student_id && adminEditState.editingStudentForPass?.homeworkId === homework.homework_id;
                          return (
                          <div key={`${homework.homework_id}-${student.student_id}`} className="student-card">
                            <div className="student-info">
                              <div className="student-name">{student.student_name}</div>
                              <div className="student-group">{student.group_name}</div>
                            </div>
                            <div className="student-status">
                              <span 
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(student.status_text) }}
                              >
                                {student.status_text}
                              </span>
                              {student.result && (
                                <span 
                                  className="score-badge"
                                  style={{ color: getScoreColor(student.result) }}
                                >
                                  {student.result} баллов
                                </span>
                              )}
                              {student.days_overdue > 0 && (
                                <span className="overdue-badge">
                                  +{student.days_overdue} дн.
                                </span>
                              )}
                            </div>
                              <div className="student-actions">
                                {isSubmitted ? (
                                  isEditingSubmitted ? (
                                    <div className="inline-form">
                                      <input
                                        type="date"
                                        value={adminEditState.datePass}
                                        onChange={(e) => setAdminEditState(prev => ({ ...prev, datePass: e.target.value }))}
                                      />
                                    <button className="action-btn action-btn--primary" disabled={adminEditState.submitting || !adminEditState.datePass} onClick={handleAdminEditHomework}>
                                        {adminEditState.submitting ? 'Сохранение...' : 'Сохранить'}
                                      </button>
                                    <button className="action-btn action-btn--ghost" onClick={cancelEdit}>Отмена</button>
                                    </div>
                                  ) : (
                                    <button className="action-btn action-btn--outline" onClick={() => openEditForm(homework.homework_id, student)}>
                                      Редактировать дату
                                    </button>
                                  )
                                ) : (
                                  isEditingPass ? (
                                    <div className="inline-form">
                                      <input
                                        type="date"
                                        value={adminEditState.datePass}
                                        onChange={(e) => setAdminEditState(prev => ({ ...prev, datePass: e.target.value }))}
                                      />
                                      <button className="action-btn action-btn--primary" disabled={adminEditState.submitting || !adminEditState.datePass} onClick={handleAdminPassHomework}>
                                        {adminEditState.submitting ? 'Отправка...' : 'Отправить'}
                                      </button>
                                      <button className="action-btn action-btn--ghost" onClick={cancelEdit}>Отмена</button>
                                    </div>
                                  ) : (
                                    <button className="action-btn action-btn--outline" onClick={() => openPassForm(homework.homework_id, student)}>
                                      Занести ДЗ
                                    </button>
                                  )
                                )}
                              </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 0 && (
          <div className="pagination">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              В начало
            </button>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(prev.currentPage - 1, 1) }))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Назад
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let start = Math.max(1, currentPage - 3);
                let end = Math.min(totalPages, start + 6);
                start = Math.max(1, end - 6);
                return start + i;
              }).map(number => (
                <button
                  key={number}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: number }))}
                  className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                >
                  {number}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.currentPage + 1, totalPages) }))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Вперед
            </button>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: totalPages }))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              В конец
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkResults;
