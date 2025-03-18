import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Config/firebase';
import { signOut } from 'firebase/auth';
import { getUserProfile, updateUserProgress } from '../Services';

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
                    if (!profile.xpThreshold) {
                        profile.xpThreshold = 100; // Default XP threshold if missing
                    }
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
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Function to dynamically determine XP threshold
    const getXpThreshold = (level) => {
        return 100 + level * 20; // XP required increases as level goes up
    };

    // Handle leveling up with XP overflow
    useEffect(() => {
        if (userData && userData.xp >= userData.xpThreshold) {
            let newLevel = userData.level;
            let overflowXp = userData.xp;
            let newXpThreshold;

            while (overflowXp >= getXpThreshold(newLevel)) {
                overflowXp -= getXpThreshold(newLevel);
                newLevel += 1;
            }
            newXpThreshold = getXpThreshold(newLevel);
            
            updateUserProgress(auth.currentUser.uid, overflowXp, newLevel, newXpThreshold);
            setUserData(prevState => ({ ...prevState, xp: overflowXp, level: newLevel, xpThreshold: newXpThreshold }));
        }
    }, [userData]);
    
    return (
        <div style={{ padding: '20px' }}>
            <h2>Welcome, {userData?.username || 'Player'}!</h2>
            {loading ? <p>Loading...</p> : (
                <div className="player-profile">
                    <h3>Level {userData.level} Striker</h3>
                    <div style={{ background: '#eee', borderRadius: '5px', height: '20px', width: '100%', marginBottom: '20px' }}>
                        <div style={{ background: '#007bff', height: '100%', width: `${userData.xpThreshold ? (userData.xp / userData.xpThreshold) * 100 : 0}%`, borderRadius: '5px', transition: 'width 0.5s ease-in-out' }}></div>
                        <div style={{ textAlign: 'center', marginTop: '5px' }}>
                            {userData.xp} / {userData.xpThreshold || getXpThreshold(userData.level)} XP
                        </div>
                    </div>
                    <h3>Core Stats</h3>
                    {userData.skills && Object.entries(userData.skills).map(([skill, value]) => (
                        <div key={skill} style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => navigate(`/stat/${skill.toLowerCase()}`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ textTransform: 'capitalize' }}>{skill} (Lv {userData.skillLevels?.[skill] || 1})</span>
                                <span>{value} XP</span>
                            </div>
                            <div style={{ background: '#eee', borderRadius: '5px', height: '10px' }}>
                                <div style={{ background: '#28a745', height: '100%', width: `${(value / (userData.skillThresholds?.[skill] || 100)) * 100}%`, borderRadius: '5px', transition: 'width 0.5s ease-in-out' }}></div>
                            </div>
                        </div>
                    ))}
                    <button 
                        style={{ padding: '15px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', width: '100%' }}
                        onClick={() => navigate('/training')}
                    >
                        START TRAINING
                    </button>
                </div>
            )}
            <button 
                onClick={handleLogout}
                style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}
            >
                Logout
            </button>
        </div>
    );
};

export default DashboardPage;
