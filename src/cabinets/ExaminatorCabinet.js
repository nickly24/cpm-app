import Exam from "./ExaminatorFunctions/Exam";
import Examiner from "./ExaminatorFunctions/Examiner";
import { useAuth } from '../AuthContext';

function ExaminatorCabinet() {
    const { logout } = useAuth();
    
    const handleLogout = async () => {
        await logout();
  };
    
    return(
        <>
            <button onClick={handleLogout} className="logout-button">
                Выйти
              </button>
              <Examiner/>
        </>
        
    )
}
export default ExaminatorCabinet;