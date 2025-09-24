import { useState, useEffect } from 'react';
import Login from './Login';
import StudentCabinet from './cabinets/StudentCabinet';
import ProctorCabinet from './cabinets/ProctorCabinet';
import AdminCabinet from './cabinets/AdminCabinet';
import ExaminatorCabinet from './cabinets/ExaminatorCabinet';
import SupervisorCabinet from './cabinets/SupervisorCabinet';
import './App.css'
function App() {
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  useEffect(() => {
    const handleStorageChange = () => {
      setRole(localStorage.getItem('role') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!role) {
    return <Login />;
  }

  const renderCabinet = () => {
    switch (role) {
      case 'student':
        return <StudentCabinet />;
      case 'proctor':
        return <ProctorCabinet />;
      case 'admin':
        return <AdminCabinet />;
      case 'examinator':
        return <ExaminatorCabinet />;
      case 'supervisor':
        return <SupervisorCabinet />;
      default:
        return <div>Неизвестная роль: {role}</div>;
    }
  };

  return (
    <div className="App">
      {renderCabinet()}
    </div>
  );
}

export default App;