import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Config/firebase';
import { signOut } from 'firebase/auth';
import { getUserProfile } from '../Services';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    setUserData(profile);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

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
            <h2>Welcome, {userData?.username || 'Player'}!</h2>
            
            {userData && (
                <div className="player-profile">
                    <h3>Level {userData.level} Striker</h3>
                    <div style={{ 
                        background: '#eee', 
                        borderRadius: '5px', 
                        height: '20px', 
                        width: '100%', 
                        marginBottom: '20px' 
                    }}>
                        <div style={{ 
                            background: '#007bff', 
                            height: '100%', 
                            width: `${(userData.xp / 100) * 100}%`, 
                            borderRadius: '5px' 
                        }}></div>
                        <div style={{ textAlign: 'center', marginTop: '5px' }}>
                            {userData.xp} / 100 XP
                        </div>
                    </div>

                    <h3>Core Stats</h3>
                    {userData.skills && Object.entries(userData.skills).map(([skill, value]) => (
                        <div key={skill} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ textTransform: 'capitalize' }}>{skill}</span>
                                <span>{value}</span>
                            </div>
                            <div style={{ 
                                background: '#eee', 
                                borderRadius: '5px', 
                                height: '10px' 
                            }}>
                                <div style={{ 
                                    background: '#007bff', 
                                    height: '100%', 
                                    width: `${value}%`, 
                                    borderRadius: '5px' 
                                }}></div>
                            </div>
                        </div>
                    ))}

                    <button 
                        style={{ 
                            padding: '15px 30px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginTop: '20px',
                            width: '100%'
                        }}
                    >
                        START TRAINING
                    </button>
                </div>
            )}

            <button 
                onClick={handleLogout}
                style={{ 
                    padding: '10px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                Logout
            </button>
        </div>
    );
};

export default DashboardPage;