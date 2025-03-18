import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../Config/firebase";
import { getUserProfile, updateUserSkills, updateUserProgress } from "../Services";

const StatPage = () => {
    const { skill } = useParams(); // Get skill name from URL
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quests, setQuests] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    setUserData(profile);
                    generateQuests(profile.skills[skill]);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [skill]);

    // Generate sample quests based on skill level
    const generateQuests = (skillLevel) => {
        const baseQuests = [
            { id: 1, title: "Basic Drills", xp: 10 },
            { id: 2, title: "Intermediate Training", xp: 20 },
            { id: 3, title: "Advanced Mastery", xp: 30 }
        ];
        
        setQuests(baseQuests.filter(q => skillLevel >= q.xp / 2));
    };

    const completeQuest = async (xpGained) => {
        if (!userData) return;
        const updatedSkillXP = userData.skills[skill] + xpGained;
        const updatedXP = userData.xp + xpGained;
        let updatedLevel = userData.level;
        
        if (updatedXP >= 100) {
            updatedLevel += 1;
        }
        
        await updateUserSkills(auth.currentUser.uid, { ...userData.skills, [skill]: updatedSkillXP });
        await updateUserProgress(auth.currentUser.uid, updatedXP, updatedLevel);
        setUserData({ ...userData, skills: { ...userData.skills, [skill]: updatedSkillXP }, xp: updatedXP, level: updatedLevel });
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>{skill.charAt(0).toUpperCase() + skill.slice(1)} Training</h2>
            {loading ? <p>Loading...</p> : (
                <div>
                    <h3>Your Current {skill} Level: {userData?.skills[skill]}</h3>
                    <h3>Available Quests</h3>
                    {quests.map((quest) => (
                        <div key={quest.id} style={{ marginBottom: "15px" }}>
                            <p>{quest.title} - XP: {quest.xp}</p>
                            <button 
                                style={{ 
                                    padding: '10px', 
                                    backgroundColor: '#28a745', 
                                    color: 'white', 
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                                onClick={() => completeQuest(quest.xp)}
                            >
                                Complete Quest
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatPage;