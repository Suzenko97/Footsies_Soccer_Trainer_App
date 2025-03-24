import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../Config/firebase";
import { getUserProfile, updateUserSkills, updateUserProgress } from "../Services";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faDumbbell, faTasks, faRunning, faFutbol, faBullseye, faRandom, faLock, faClock, faStar, faPlay } from '@fortawesome/free-solid-svg-icons';

const SkillTrainingPage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSkill, setSelectedSkill] = useState('dribbling');
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
                    generateTrainingModules(profile.skillLevels[selectedSkill] || 1);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [selectedSkill]);

    const questsData = {
        stamina: [
            { id: 1, title: "Endurance Run", xp: 10, skillXp: 20, description: "Complete a 20-minute continuous run" },
            { id: 2, title: "Sprint Repeats", xp: 15, skillXp: 25, description: "Perform 10 sets of 30-second sprints" }
        ],
        dribbling: [
            { id: 3, title: "Cone Dribbling", xp: 10, skillXp: 20, description: "Complete the cone dribbling course 5 times" },
            { id: 4, title: "Fast Footwork", xp: 15, skillXp: 25, description: "Practice quick touches for 10 minutes" }
        ],
        shooting: [
            { id: 5, title: "Target Practice", xp: 12, skillXp: 22, description: "Hit each corner of the goal 5 times" },
            { id: 6, title: "Power Shots", xp: 18, skillXp: 28, description: "Score 10 goals from outside the box" }
        ],
        passing: [
            { id: 7, title: "Wall Passes", xp: 10, skillXp: 20, description: "Complete 50 wall passes accurately" },
            { id: 8, title: "Through Balls", xp: 15, skillXp: 25, description: "Practice through balls with moving targets" }
        ]
    };

    const generateQuests = (level) => {
        const dailyQuestCount = Math.min(3, Math.floor(level / 2) + 1);
        const weeklyQuestCount = Math.min(5, Math.floor(level / 3) + 2);

        const allQuests = Object.values(questsData).flat();
        const shuffled = [...allQuests].sort(() => 0.5 - Math.random());

        setDailyQuests(shuffled.slice(0, dailyQuestCount));
        setWeeklyQuests(shuffled.slice(dailyQuestCount, dailyQuestCount + weeklyQuestCount));
    };

    const generateTrainingModules = (skillLevel) => {
        const modules = [
            {
                id: 1,
                title: `Basic ${selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1)} Training`,
                difficulty: "Beginner",
                duration: "15 mins",
                xp: 20,
                skillXp: 30,
                unlocked: true
            },
            {
                id: 2,
                title: `Intermediate ${selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1)} Drills`,
                difficulty: "Intermediate",
                duration: "20 mins",
                xp: 30,
                skillXp: 45,
                unlocked: skillLevel >= 2
            },
            {
                id: 3,
                title: `Advanced ${selectedSkill.charAt(0).toUpperCase() + selectedSkill.slice(1)} Mastery`,
                difficulty: "Advanced",
                duration: "30 mins",
                xp: 50,
                skillXp: 75,
                unlocked: skillLevel >= 3
            }
        ];
        setTrainingModules(modules);
    };

    const addNotification = (message) => {
        setNotifications(prev => [...prev, message]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
    };

    const completeQuest = async (quest) => {
        if (!userData) return;
        
        let updatedSkillXP = (userData.skills[selectedSkill] || 0) + quest.skillXp;
        let updatedSkillLevel = userData.skillLevels[selectedSkill] || 1;
        let updatedSkillThreshold = userData.skillThresholds[selectedSkill] || 100;

        if (updatedSkillXP >= updatedSkillThreshold) {
            let overflowSkillXP = updatedSkillXP - updatedSkillThreshold;
            updatedSkillLevel += 1;
            updatedSkillThreshold += 20;
            updatedSkillXP = overflowSkillXP;
            addNotification(`${selectedSkill} leveled up to Level ${updatedSkillLevel}!`);
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
            [selectedSkill]: updatedSkillXP
        }, {
            ...userData.skillLevels,
            [selectedSkill]: updatedSkillLevel
        }, {
            ...userData.skillThresholds,
            [selectedSkill]: updatedSkillThreshold
        });

        await updateUserProgress(auth.currentUser.uid, updatedXP, updatedLevel, updatedXpThreshold);
        
        setUserData({ 
            ...userData, 
            skills: { ...userData.skills, [selectedSkill]: updatedSkillXP }, 
            skillLevels: { ...userData.skillLevels, [selectedSkill]: updatedSkillLevel },
            skillThresholds: { ...userData.skillThresholds, [selectedSkill]: updatedSkillThreshold },
            xp: updatedXP, 
            level: updatedLevel, 
            xpThreshold: updatedXpThreshold
        });
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-md-4 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faGraduationCap} className="me-2"></FontAwesomeIcon>
                                Skills Training
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="list-group mb-4">
                                {Object.keys(questsData).map(skill => {
                                    const progress = userData.skills[skill] || 0;
                                    const level = userData.skillLevels[skill] || 1;
                                    const threshold = userData.skillThresholds[skill] || 100;
                                    const progressPercentage = Math.min(100, (progress / threshold) * 100);
                                    
                                    return (
                                        <div key={skill} className="mb-3">
                                            <button
                                                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedSkill === skill ? 'active' : ''}`}
                                                onClick={() => setSelectedSkill(skill)}
                                            >
                                                <span>
                                                    <FontAwesomeIcon icon={skill === 'stamina' ? faRunning : 
                                                                  skill === 'dribbling' ? faFutbol : 
                                                                  skill === 'shooting' ? faBullseye : 
                                                                  faRandom} className="me-2"></FontAwesomeIcon>
                                                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                                                </span>
                                                <span className="badge bg-primary rounded-pill">
                                                    Lv {level}
                                                </span>
                                            </button>
                                            <div className="px-3 py-2">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <small className="text-muted">Progress</small>
                                                    <small className="text-muted">{progress} / {threshold}</small>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div 
                                                        className="progress-bar" 
                                                        role="progressbar" 
                                                        style={{ width: `${progressPercentage}%` }}
                                                        aria-valuenow={progressPercentage} 
                                                        aria-valuemin="0" 
                                                        aria-valuemax="100"
                                                    >
                                                        {progressPercentage > 10 && `${Math.round(progressPercentage)}%`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faDumbbell} className="me-2"></FontAwesomeIcon>
                                Training Modules
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {trainingModules.map(module => (
                                    <div key={module.id} className="col-12">
                                        <div className={`card ${!module.unlocked ? 'bg-light' : ''}`}>
                                            <div className="card-body">
                                                <h5 className="card-title">
                                                    {module.title}
                                                    {!module.unlocked && (
                                                        <FontAwesomeIcon icon={faLock} className="ms-2 text-muted"></FontAwesomeIcon>
                                                    )}
                                                </h5>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="badge bg-info me-2">
                                                            <FontAwesomeIcon icon={faClock} className="me-1"></FontAwesomeIcon>
                                                            {module.duration}
                                                        </span>
                                                        <span className="badge bg-warning me-2">
                                                            <FontAwesomeIcon icon={faStar} className="me-1"></FontAwesomeIcon>
                                                            {module.difficulty}
                                                        </span>
                                                    </div>
                                                    <button 
                                                        className={`btn ${module.unlocked ? 'btn-primary' : 'btn-secondary'}`}
                                                        disabled={!module.unlocked}
                                                        onClick={() => completeQuest({ id: module.id, title: module.title, xp: module.xp, skillXp: module.skillXp, description: '' })}
                                                    >
                                                        <FontAwesomeIcon icon={faPlay} className="me-2"></FontAwesomeIcon>
                                                        Start Training
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faTasks} className="me-2"></FontAwesomeIcon>
                                Daily Quests
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="list-group">
                                {dailyQuests.map(quest => (
                                    <div key={quest.id} className="list-group-item">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="mb-1">{quest.title}</h6>
                                                <p className="text-muted small mb-0">{quest.description}</p>
                                            </div>
                                            <div className="text-end">
                                                <div className="small text-muted mb-1">Rewards:</div>
                                                <span className="badge bg-primary me-1">
                                                    <FontAwesomeIcon icon={faStar} className="me-1"></FontAwesomeIcon>
                                                    {quest.xp} XP
                                                </span>
                                                <span className="badge bg-info">
                                                    <FontAwesomeIcon icon={faStar} className="me-1"></FontAwesomeIcon>
                                                    {quest.skillXp} Skill XP
                                                </span>
                                                <button 
                                                    className="btn btn-primary ms-2"
                                                    onClick={() => completeQuest(quest)}
                                                >
                                                    Complete Quest
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {notifications.map((note, index) => (
                <div key={index} className="alert alert-success" role="alert">
                    {note}
                </div>
            ))}
        </div>
    );
};

export default SkillTrainingPage;
