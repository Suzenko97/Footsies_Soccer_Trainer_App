import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../Config/firebase";
import { getUserProfile, updateUserSkills, updateUserProgress } from "../Services";

const SkillTrainingPage = () => {
    const { skill } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dailyQuests, setDailyQuests] = useState([]);
    const [weeklyQuests, setWeeklyQuests] = useState([]);
    const [trainingModules, setTrainingModules] = useState([]);
    const [activeQuest, setActiveQuest] = useState(null);
    const [questProgress, setQuestProgress] = useState(0);
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
                        skillThresholds: profile.skillThresholds || {},
                        completedQuests: profile.completedQuests || {}
                    });
                    generateQuests(profile.completedQuests || {});
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
            { id: 1, title: "Endurance Run", xp: 10, skillXp: 20, cooldown: 86400000 },
            { id: 2, title: "Sprint Repeats", xp: 15, skillXp: 25, cooldown: 604800000 }
        ],
        dribbling: [
            { id: 3, title: "Cone Dribbling", xp: 10, skillXp: 20, cooldown: 86400000 },
            { id: 4, title: "Fast Footwork", xp: 15, skillXp: 25, cooldown: 604800000 }
        ]
    };

    const generateQuests = (completedQuests) => {
        const now = Date.now();
        setDailyQuests(questsData[skill]?.map(q => ({
            ...q,
            available: !completedQuests[q.id] || now - completedQuests[q.id] >= q.cooldown
        })) || []);
        setWeeklyQuests((questsData[skill] || []).map(q => ({
            ...q,
            xp: q.xp * 2,
            skillXp: q.skillXp * 2,
            available: !completedQuests[q.id] || now - completedQuests[q.id] >= q.cooldown
        })));
    };

    const generateTrainingModules = (skillLevel) => {
        const modules = {
            stamina: [
                { id: 1, title: "Basic Endurance Training", skillXp: 50, requiredLevel: 1, videoUrl: "https://www.youtube.com/embed/" },
                { id: 2, title: "Advanced Stamina Drills", skillXp: 75, requiredLevel: 3, videoUrl: "https://www.youtube.com/embed/79cx5vmf3Qg?si=W2SS4lYQaJAss-0g" }
            ],
            dribbling: [
                { id: 3, title: "Basic Ball Control", skillXp: 50, requiredLevel: 1, videoUrl: "https://www.youtube.com/embed/" },
                { id: 4, title: "Advanced Dribbling Techniques", skillXp: 75, requiredLevel: 3, videoUrl: "https://www.youtube.com/embed/" }
            ]
        };
        setTrainingModules(modules[skill]?.map(module => ({
            ...module,
            unlocked: skillLevel >= module.requiredLevel
        })) || []);
    };

    const startQuest = (quest) => {
        if (!quest.available) return;
        setActiveQuest(quest);
        setQuestProgress(0);
    };

    const completeQuest = async () => {
        if (!activeQuest || questProgress < 100) return;
        
        let updatedCompletedQuests = { ...userData.completedQuests, [activeQuest.id]: Date.now() };
        let updatedSkillXP = (userData.skills[skill] || 0) + activeQuest.skillXp;
        let updatedXP = userData.xp + activeQuest.xp;
        
        await updateUserSkills(auth.currentUser.uid, {
            ...userData.skills,
            [skill]: updatedSkillXP
        }, userData.skillLevels, userData.skillThresholds);
        
        await updateUserProgress(auth.currentUser.uid, updatedXP, userData.level, userData.xpThreshold);
        
        setUserData({ ...userData, completedQuests: updatedCompletedQuests });
        setActiveQuest(null);
        generateQuests(updatedCompletedQuests);
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>{skill.charAt(0).toUpperCase() + skill.slice(1)} Training</h2>
            <button onClick={() => navigate("/")} style={{ marginBottom: "10px" }}>Back to Dashboard</button>
            <h3>Your {skill} Level: {userData?.skillLevels[skill] || 1}</h3>
            <h3>Daily Quests</h3>
            {dailyQuests.map((quest) => (
                <div key={quest.id}>
                    <p>{quest.title} - XP: {quest.xp}, Skill XP: {quest.skillXp}</p>
                    <button onClick={() => startQuest(quest)} disabled={!quest.available}>Start Quest</button>
                </div>
            ))}
            {activeQuest && (
                <div>
                    <p>Quest in progress: {activeQuest.title}</p>
                    <progress value={questProgress} max="100"></progress>
                    <button onClick={completeQuest} disabled={questProgress < 100}>Complete Quest</button>
                </div>
            )}
            <h3>Training Modules</h3>
            {trainingModules.map((module) => (
                <div key={module.id} style={{ opacity: module.unlocked ? 1 : 0.5 }}>
                    <p>{module.title} {module.unlocked ? "(Unlocked)" : `(Unlocks at Level ${module.requiredLevel})`}</p>
                    <iframe width="560" height="315" src={module.videoUrl} title={module.title} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                    <button disabled={!module.unlocked}>Start Training</button>
                </div>
            ))}
        </div>
    );
};

export default SkillTrainingPage;
