import React, { useEffect, useState } from "react";
import { auth } from "../Config/firebase";
import { getUserProfile, updateUserProgress } from "../Services";

const TrainingPage = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dailyQuests, setDailyQuests] = useState([]);
    const [weeklyQuests, setWeeklyQuests] = useState([]);
    const [completedQuests, setCompletedQuests] = useState([]);
    const [questHistory, setQuestHistory] = useState([]);
    const [resetTime, setResetTime] = useState({ daily: null, weekly: null });
    const maxDailyQuests = 3;
    const maxWeeklyQuests = 2;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    setUserData(profile);
                    generateQuests(profile.level);
                    setupResetTimers();
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const generateQuests = (level) => {
        const sampleDaily = [
            { id: 1, title: "Sprint Drills", xp: 15 },
            { id: 2, title: "Passing Accuracy", xp: 20 },
            { id: 3, title: "Shooting Precision", xp: 25 }
        ].slice(0, maxDailyQuests);
        
        const sampleWeekly = [
            { id: 4, title: "Full Match Simulation", xp: 50 },
            { id: 5, title: "Endurance Challenge", xp: 40 }
        ].slice(0, maxWeeklyQuests);

        setDailyQuests(sampleDaily);
        setWeeklyQuests(sampleWeekly);
    };

    const setupResetTimers = () => {
        const now = new Date();
        const dailyReset = new Date();
        dailyReset.setHours(24, 0, 0, 0);

        const weeklyReset = new Date();
        weeklyReset.setDate(weeklyReset.getDate() + (7 - weeklyReset.getDay()));
        weeklyReset.setHours(0, 0, 0, 0);

        setResetTime({ daily: dailyReset, weekly: weeklyReset });
    };

    const completeQuest = async (quest) => {
        if (!userData || completedQuests.includes(quest.id)) return;
        
        const updatedXP = userData.xp + quest.xp;
        let updatedLevel = userData.level;
        
        if (updatedXP >= 100) {
            updatedLevel += 1;
        }
        
        await updateUserProgress(auth.currentUser.uid, updatedXP, updatedLevel);
        setUserData({ ...userData, xp: updatedXP, level: updatedLevel });
        setCompletedQuests([...completedQuests, quest.id]);
        setQuestHistory([...questHistory, { title: quest.title, date: new Date().toLocaleString() }]);
        
        alert(`Quest Completed: ${quest.title}! You gained ${quest.xp} XP!`);
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Training Quests</h2>
            {loading ? <p>Loading...</p> : (
                <div>
                    <h3>Daily Quests (Resets at {resetTime.daily?.toLocaleTimeString()})</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                        {dailyQuests.map((quest) => (
                            <div key={quest.id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", width: "200px", background: "#f9f9f9" }}>
                                <h4>{quest.title}</h4>
                                <p>XP: {quest.xp}</p>
                                <button 
                                    style={{ padding: '10px', backgroundColor: completedQuests.includes(quest.id) ? '#aaa' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: completedQuests.includes(quest.id) ? 'not-allowed' : 'pointer', marginTop: '10px' }}
                                    onClick={() => completeQuest(quest)}
                                    disabled={completedQuests.includes(quest.id)}
                                >
                                    {completedQuests.includes(quest.id) ? "Completed" : "Complete Quest"}
                                </button>
                            </div>
                        ))}
                    </div>
                    <h3>Weekly Quests (Resets at {resetTime.weekly?.toLocaleDateString()})</h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
                        {weeklyQuests.map((quest) => (
                            <div key={quest.id} style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", width: "200px", background: "#eef5ff" }}>
                                <h4>{quest.title}</h4>
                                <p>XP: {quest.xp}</p>
                                <button 
                                    style={{ padding: '10px', backgroundColor: completedQuests.includes(quest.id) ? '#aaa' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: completedQuests.includes(quest.id) ? 'not-allowed' : 'pointer', marginTop: '10px' }}
                                    onClick={() => completeQuest(quest)}
                                    disabled={completedQuests.includes(quest.id)}
                                >
                                    {completedQuests.includes(quest.id) ? "Completed" : "Complete Quest"}
                                </button>
                            </div>
                        ))}
                    </div>
                    <h3>Quest History</h3>
                    <ul>
                        {questHistory.map((entry, index) => (
                            <li key={index}>{entry.title} - Completed on {entry.date}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TrainingPage;
