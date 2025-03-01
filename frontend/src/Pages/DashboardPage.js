import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Config/firebase';
import { signOut } from 'firebase/auth';

const DashboardPage = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login'); //Redirect login after user logout
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Welcome to Dashboard!</h2>
            <button 
                onClick={handleLogout}
                style={{ 
                    padding: '10px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Logout
            </button>
        </div>
    );
};

export default DashboardPage;