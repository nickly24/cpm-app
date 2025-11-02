import { useAuth } from './AuthContext';
import Login from './Login';
import StudentCabinet from './cabinets/StudentCabinet';
import ProctorCabinet from './cabinets/ProctorCabinet';
import AdminCabinet from './cabinets/AdminCabinet';
import ExaminatorCabinet from './cabinets/ExaminatorCabinet';
import SupervisorCabinet from './cabinets/SupervisorCabinet';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderCabinet = () => {
    switch (user.role) {
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
        return <div>Неизвестная роль: {user.role}</div>;
    }
  };

  return (
    <div className="App">
      {renderCabinet()}
    </div>
  );
}

export default App;