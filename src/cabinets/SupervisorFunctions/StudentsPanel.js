import React, { useEffect, useState, useMemo } from 'react';
import axios from '../../api';
import './StudentsPanel.css';
import StudentInfo from './StudentInfo';
import { API_EXAM_URL } from '../../Config';

const LoadingSpinner = () => (
  <div className="spinner-container">
    <div className="loading-spinner"></div>
    <p>Загрузка данных...</p>
  </div>
);

export default function StudentsPanel() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const studentsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_EXAM_URL}/get-all-rating`);
                setStudents(response.data.data.students);
                setLoading(false);
            } catch (error) {
                console.error("Ошибка при получении данных:", error);
                setError("Не удалось загрузить данные");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(student => 
            student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
    };

    const handleBack = () => {
        setSelectedStudent(null);
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error">{error}</div>;

    if (selectedStudent) {
        return (
            <div className="student-info-container">
                <StudentInfo studentId={selectedStudent.id} onBack={handleBack} />
            </div>
        );
    }
    
    return (
        <div className="students-panel">
            <h2>Список студентов</h2>
            
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Поиск по имени..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="search-input"
                />
            </div>
            
            <div className="table-container">
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Рейтинг по домашкам</th>
                            <th>Рейтинг по тестам</th>
                            <th>Рейтинг по экзаменам</th>
                            <th>Общий рейтинг</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentStudents.length > 0 ? (
                            currentStudents.map(student => (
                                <tr 
                                    key={student.id}
                                    onClick={() => handleStudentClick(student)}
                                    className="clickable-row"
                                >
                                    <td>{student.full_name}</td>
                                    <td>{student.homework_rate}</td>
                                    <td>{student.test_rate}</td>
                                    <td>{student.exam_rate}</td>
                                    <td>{student.rate}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="no-results">Студенты не найдены</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {filteredStudents.length > studentsPerPage && (
                <div className="pagination">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                    >
                        Назад
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={currentPage === number ? 'active' : ''}
                        >
                            {number}
                        </button>
                    ))}
                    
                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                    >
                        Вперед
                    </button>
                </div>
            )}
            
            <div className="students-count">
                Показано {currentStudents.length} из {filteredStudents.length} студентов
            </div>
        </div>
    );
}