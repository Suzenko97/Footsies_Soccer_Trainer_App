import React, { useEffect, useState } from "react";
import { auth } from "../Config/firebase";
import { getUserProfile } from "../Services";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faRunning, faFutbol, faBullseye, faRandom, faTrophy, faCalendarAlt, faFire } from '@fortawesome/free-solid-svg-icons';

const StatPage = () => {
    const [userData, setUserData] = useState({
        skills: {},
        skillLevels: {},
        skillThresholds: {},
        xp: 0,
        level: 1,
        xpThreshold: 100
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    if (profile) {
                        setUserData({
                            ...profile,
                            skills: profile.skills || {},
                            skillLevels: profile.skillLevels || {},
                            skillThresholds: profile.skillThresholds || {}
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);

    // Mock training data for charts and stats
    const trainingData = {
        lastWeek: [
            { date: 'Mon', minutes: 15 },
            { date: 'Tue', minutes: 30 },
            { date: 'Wed', minutes: 0 },
            { date: 'Thu', minutes: 45 },
            { date: 'Fri', minutes: 20 },
            { date: 'Sat', minutes: 60 },
            { date: 'Sun', minutes: 10 }
        ],
        achievements: [
            { id: 1, title: 'First Training Session', date: '2023-05-10', icon: faCalendarAlt },
            { id: 2, title: 'Reach Level 5', date: '2023-05-15', icon: faTrophy },
            { id: 3, title: '7-Day Streak', date: '2023-05-22', icon: faFire }
        ]
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

    // Calculate total training time
    const totalTrainingTime = trainingData.lastWeek.reduce((acc, day) => acc + day.minutes, 0);
    const totalDaysActive = trainingData.lastWeek.filter(day => day.minutes > 0).length;
    
    // Get highest skill
    const skills = [
        { name: 'stamina', icon: faRunning, color: '#28a745' },
        { name: 'dribbling', icon: faFutbol, color: '#007bff' },
        { name: 'shooting', icon: faBullseye, color: '#dc3545' },
        { name: 'passing', icon: faRandom, color: '#fd7e14' }
    ];
    
    const highestSkill = skills.reduce((highest, skill) => {
        const level = userData.skillLevels?.[skill.name] || 1;
        if (level > (highest.level || 0)) {
            return { name: skill.name, level };
        }
        return highest;
    }, { level: 0 });

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-3">
                        <FontAwesomeIcon icon={faChartLine} className="me-2" />
                        Statistics
                    </h2>
                    <p className="text-muted">Track your progress and performance over time</p>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'skills' ? 'active' : ''}`}
                                onClick={() => setActiveTab('skills')}
                            >
                                Skills
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'achievements' ? 'active' : ''}`}
                                onClick={() => setActiveTab('achievements')}
                            >
                                Achievements
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="row">
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Profile</h5>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                                        {userData.displayName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="mb-0">{userData.displayName || 'User'}</h6>
                                        <small className="text-muted">Level {userData.level || 1}</small>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted">XP Progress</small>
                                    <small className="text-muted">{userData.xp || 0} / {userData.xpThreshold || 100}</small>
                                </div>
                                <div className="progress mb-4" style={{ height: '8px' }}>
                                    <div 
                                        className="progress-bar" 
                                        role="progressbar" 
                                        style={{ width: `${Math.min(100, ((userData.xp || 0) / (userData.xpThreshold || 100)) * 100)}%` }}
                                        aria-valuenow={Math.min(100, ((userData.xp || 0) / (userData.xpThreshold || 100)) * 100)} 
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Last 7 Days</h5>
                                <div className="row text-center">
                                    <div className="col">
                                        <h3 className="mb-0">{totalTrainingTime}</h3>
                                        <small className="text-muted">Minutes</small>
                                    </div>
                                    <div className="col">
                                        <h3 className="mb-0">{totalDaysActive}</h3>
                                        <small className="text-muted">Active Days</small>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="d-flex justify-content-between mb-3">
                                        {trainingData.lastWeek.map((day, index) => (
                                            <div key={index} className="text-center" style={{ width: '14%' }}>
                                                <div className="progress" style={{ height: '80px' }}>
                                                    <div 
                                                        className="progress-bar" 
                                                        role="progressbar" 
                                                        style={{ 
                                                            width: '100%', 
                                                            height: `${(day.minutes / 60) * 100}%`,
                                                            marginTop: 'auto',
                                                            backgroundColor: day.minutes > 0 ? '#28a745' : '#e9ecef'
                                                        }}
                                                    ></div>
                                                </div>
                                                <small className="text-muted">{day.date}</small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Highlights</h5>
                                <div className="mb-3">
                                    <h6>Best Skill</h6>
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">
                                            {skills.find(s => s.name === highestSkill.name) && (
                                                <FontAwesomeIcon 
                                                    icon={skills.find(s => s.name === highestSkill.name).icon} 
                                                    className="fa-2x" 
                                                    style={{ color: skills.find(s => s.name === highestSkill.name).color }}
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-capitalize">{highestSkill.name || 'None'}</div>
                                            <small className="text-muted">Level {highestSkill.level || 1}</small>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h6>Latest Achievement</h6>
                                    {trainingData.achievements.length > 0 ? (
                                        <div className="d-flex align-items-center">
                                            <div className="me-3">
                                                <FontAwesomeIcon 
                                                    icon={trainingData.achievements[trainingData.achievements.length - 1].icon} 
                                                    className="fa-2x text-warning" 
                                                />
                                            </div>
                                            <div>
                                                <div>{trainingData.achievements[trainingData.achievements.length - 1].title}</div>
                                                <small className="text-muted">{trainingData.achievements[trainingData.achievements.length - 1].date}</small>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted">No achievements yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'skills' && (
                <div className="row">
                    {skills.map((skill) => {
                        const progress = userData.skills?.[skill.name] || 0;
                        const level = userData.skillLevels?.[skill.name] || 1;
                        const threshold = userData.skillThresholds?.[skill.name] || 100;
                        const progressPercentage = Math.min(100, (progress / threshold) * 100);

                        return (
                            <div key={skill.name} className="col-md-6 mb-4">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="card-title mb-0 text-capitalize">
                                                <FontAwesomeIcon icon={skill.icon} className="me-2" style={{ color: skill.color }} />
                                                {skill.name}
                                            </h5>
                                            <span className="badge bg-primary">Level {level}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1">
                                            <small className="text-muted">Progress</small>
                                            <small className="text-muted">{progress} / {threshold}</small>
                                        </div>
                                        <div className="progress mb-3">
                                            <div 
                                                className="progress-bar" 
                                                role="progressbar" 
                                                style={{ width: `${progressPercentage}%`, backgroundColor: skill.color }}
                                                aria-valuenow={progressPercentage} 
                                                aria-valuemin="0" 
                                                aria-valuemax="100"
                                            ></div>
                                        </div>
                                        <div className="small text-muted">
                                            {progressPercentage < 25 && "Just getting started! Keep practicing to improve this skill."}
                                            {progressPercentage >= 25 && progressPercentage < 50 && "Making good progress. Continue your training for this skill."}
                                            {progressPercentage >= 50 && progressPercentage < 75 && "You're becoming proficient in this skill! Keep up the good work."}
                                            {progressPercentage >= 75 && "Almost there! You're approaching mastery of this skill."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'achievements' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title mb-4">Your Achievements</h5>
                                <div className="list-group">
                                    {trainingData.achievements.map((achievement) => (
                                        <div key={achievement.id} className="list-group-item list-group-item-action">
                                            <div className="d-flex w-100 justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <div className="me-3 bg-warning text-white rounded p-2">
                                                        <FontAwesomeIcon icon={achievement.icon} />
                                                    </div>
                                                    <h6 className="mb-0">{achievement.title}</h6>
                                                </div>
                                                <small className="text-muted">{achievement.date}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatPage;