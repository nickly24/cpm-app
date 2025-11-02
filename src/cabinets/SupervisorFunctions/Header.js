import { ReactComponent as Logo } from '../logo.svg';
import StudentsPanel from './StudentsPanel';
import './Supervisor.css';
import { useAuth } from '../../AuthContext';

export default function Header(){
    const { logout } = useAuth();
    
    const handleLogout = async () => {
        await logout();
    };
    return(
        <>
         <div className='wrapper mb20'>
            <div className='header'>
                <Logo/>
                <div className='left'>
                    <button onClick={handleLogout} className="logout-button">Выйти</button>
                </div>
            </div>
         </div>
         <div className='wrapper'>
            <StudentsPanel/>
         </div>
        </>
        
    )
};