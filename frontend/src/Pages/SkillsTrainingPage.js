import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../Config/firebase";
import { getUserProfile, updateUserSkills, updateUserProgress } from "../Services";

const SkillTrainingPage = () => {
    const { skill } = useParams(); // Get skill name from URL
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dailyQuests, setDailyQuests] = useState([]);
    const [weeklyQuests, setWeeklyQuests] = useState([]);
    const [trainingModules, setTrainingModules] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    setUserData({
                        ...profile,
                        skills: profile.skills || {},
                        skillLevels: profile.skillLevels || {},
                        skillThresholds: profile.skillThresholds || {}
                    });
                    generateQuests(profile.level);
                    generateTrainingModules(profile.skillLevels[skill] || 1);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [skill]);

    const questsData = {
        stamina: [
            { id: 1, title: "Endurance Run", xp: 10, skillXp: 20 },
            { id: 2, title: "Sprint Repeats", xp: 15, skillXp: 25 }
        ],
        dribbling: [
            { id: 3, title: "Cone Dribbling", xp: 10, skillXp: 20 },
            { id: 4, title: "Fast Footwork", xp: 15, skillXp: 25 }
        ]
    };

    const generateQuests = (level) => {
        setDailyQuests(questsData[skill] || []);
        setWeeklyQuests((questsData[skill] || []).map(q => ({ ...q, xp: q.xp * 2, skillXp: q.skillXp * 2 }))); // Weekly quests give more XP
    };

    const generateTrainingModules = (skillLevel) => {
        const modules = {
            stamina: [
                { id: 1, title: "Basic Endurance Training", skillXp: 50, requiredLevel: 1 },
                { id: 2, title: "Advanced Stamina Drills", skillXp: 75, requiredLevel: 3 }
            ],
            dribbling: [
                { id: 3, title: "Basic Ball Control", skillXp: 50, requiredLevel: 1 },
                { id: 4, title: "Advanced Dribbling Techniques", skillXp: 75, requiredLevel: 3 }
            ]
        };
        setTrainingModules(modules[skill]?.map(module => ({
            ...module,
            unlocked: skillLevel >= module.requiredLevel
        })) || []);
    };

    const addNotification = (message) => {
        setNotifications(prev => [...prev, message]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
    };

    const completeQuest = async (quest) => {
        if (!userData) return;
        
        let updatedSkillXP = (userData.skills[skill] || 0) + quest.skillXp;
        let updatedSkillLevel = userData.skillLevels[skill] || 1;
        let updatedSkillThreshold = userData.skillThresholds[skill] || 100;

        if (updatedSkillXP >= updatedSkillThreshold) {
            let overflowSkillXP = updatedSkillXP - updatedSkillThreshold;
            updatedSkillLevel += 1;
            updatedSkillThreshold += 20;
            updatedSkillXP = overflowSkillXP;
            addNotification(`${skill} leveled up to Level ${updatedSkillLevel}!`);
        }

        let updatedXP = userData.xp + quest.xp;
        let updatedLevel = userData.level;
        let updatedXpThreshold = userData.xpThreshold;

        if (updatedXP >= updatedXpThreshold) {
            let overflowXp = updatedXP - updatedXpThreshold;
            updatedLevel += 1;
            updatedXpThreshold += 20;
            updatedXP = overflowXp;
            addNotification(`Account leveled up to Level ${updatedLevel}!`);
        }

        await updateUserSkills(auth.currentUser.uid, {
            ...userData.skills,
            [skill]: updatedSkillXP
        }, {
            ...userData.skillLevels,
            [skill]: updatedSkillLevel
        }, {
            ...userData.skillThresholds,
            [skill]: updatedSkillThreshold
        });

        await updateUserProgress(auth.currentUser.uid, updatedXP, updatedLevel, updatedXpThreshold);
        
        setUserData({ 
            ...userData, 
            skills: { ...userData.skills, [skill]: updatedSkillXP }, 
            skillLevels: { ...userData.skillLevels, [skill]: updatedSkillLevel },
            skillThresholds: { ...userData.skillThresholds, [skill]: updatedSkillThreshold },
            xp: updatedXP, 
            level: updatedLevel, 
            xpThreshold: updatedXpThreshold
        });
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>{skill.charAt(0).toUpperCase() + skill.slice(1)} Training</h2>
            <button onClick={() => navigate("/")} style={{ marginBottom: "10px" }}>Back to Dashboard</button>
            {notifications.map((note, index) => (
                <div key={index} style={{ background: "yellow", padding: "10px", marginBottom: "5px" }}>{note}</div>
            ))}
            {loading ? <p>Loading...</p> : (
                <>
                    <h3>Your {skill} Level: {userData?.skillLevels[skill] || 1}</h3>
                    <h3>Daily Quests</h3>
                    {dailyQuests.map((quest) => (
                        <div key={quest.id}>
                            <p>{quest.title} - XP: {quest.xp}, Skill XP: {quest.skillXp}</p>
                            <button onClick={() => completeQuest(quest)}>Complete Quest</button>
                        </div>
                    ))}
                    <h3>Weekly Quests</h3>
                    {weeklyQuests.map((quest) => (
                        <div key={quest.id}>
                            <p>{quest.title} - XP: {quest.xp}, Skill XP: {quest.skillXp}</p>
                            <button onClick={() => completeQuest(quest)}>Complete Quest</button>
                        </div>
                    ))}
                    <h3>Training Modules</h3>
                    {trainingModules.map((module) => (
                        <div key={module.id} style={{ opacity: module.unlocked ? 1 : 0.5 }}>
                            <p>{module.title} {module.unlocked ? "(Unlocked)" : `(Unlocks at Level ${module.requiredLevel})`}</p>
                            <button disabled={!module.unlocked}>Start Training</button>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

export default SkillTrainingPage;
