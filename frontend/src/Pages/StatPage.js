import React, { useEffect, useState } from "react";
import { auth } from "../Config/firebase";
import { getUserProfile } from "../Services";
import { 
    getTrainingFrequencyStats,
    getSkillProgressStats,
    getTimeSinceLastImprovement,
    getSkillImbalanceAnalysis,
    getLastTrainingSession
} from "../Services/statService";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faRunning, faFutbol, faBullseye, faRandom, faTrophy, faCalendarAlt, faFire, faChartArea, faChartBar, faCalendarDay, faHistory, faExclamationTriangle, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
    Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, 
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

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
    const [timeFrame, setTimeFrame] = useState('week'); // 'week', 'month', 'year', 'average'
    
    // Add state variables for imbalance analysis
    const [imbalanceAnalysis, setImbalanceAnalysis] = useState(null);
    const [lastImprovement, setLastImprovement] = useState(null);
    // Add state for skill progress data
    const [skillProgressData, setSkillProgressData] = useState({
        monthlyProgress: [],
        lastWeek: [],
        lastMonth: [],
        sessions: []
    });
    // Add state for latest session
    const [latestSession, setLatestSession] = useState(null);

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
                        
                        // Fetch additional data for imbalance analysis
                        const imbalance = await getSkillImbalanceAnalysis(user.uid);
                        setImbalanceAnalysis(imbalance);
                        
                        const lastImprovementData = await getTimeSinceLastImprovement(user.uid);
                        setLastImprovement(lastImprovementData);
                        
                        // Fetch skill progress data
                        const progressData = await getSkillProgressStats(user.uid);
                        setSkillProgressData(progressData);
                        
                        // Fetch latest session data
                        const lastSession = await getLastTrainingSession(user.uid);
                        setLatestSession(lastSession);
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
        lastWeek: skillProgressData.lastWeek.length > 0 ? skillProgressData.lastWeek : [
            { date: 'Mon', minutes: 15, skills: { dribbling: 5, shooting: 3, passing: 7, stamina: 0 } },
            { date: 'Tue', minutes: 30, skills: { dribbling: 10, shooting: 15, passing: 5, stamina: 0 } },
            { date: 'Wed', minutes: 0, skills: { dribbling: 0, shooting: 0, passing: 0, stamina: 0 } },
            { date: 'Thu', minutes: 45, skills: { dribbling: 20, shooting: 10, passing: 15, stamina: 0 } },
            { date: 'Fri', minutes: 20, skills: { dribbling: 5, shooting: 5, passing: 10, stamina: 0 } },
            { date: 'Sat', minutes: 60, skills: { dribbling: 15, shooting: 20, passing: 25, stamina: 0 } },
            { date: 'Sun', minutes: 10, skills: { dribbling: 5, shooting: 0, passing: 5, stamina: 0 } }
        ],
        lastMonth: skillProgressData.lastMonth.length > 0 ? skillProgressData.lastMonth : [
            { week: 'Week 1', minutes: 120, skills: { dribbling: 40, shooting: 30, passing: 50, stamina: 0 } },
            { week: 'Week 2', minutes: 180, skills: { dribbling: 60, shooting: 50, passing: 70, stamina: 0 } },
            { week: 'Week 3', minutes: 150, skills: { dribbling: 50, shooting: 40, passing: 60, stamina: 0 } },
            { week: 'Week 4', minutes: 210, skills: { dribbling: 70, shooting: 60, passing: 80, stamina: 0 } }
        ],
        skillProgress: skillProgressData.monthlyProgress.length > 0 ? skillProgressData.monthlyProgress : [
            { month: 'Jan', dribbling: 20, shooting: 15, passing: 25, stamina: 10 },
            { month: 'Feb', dribbling: 35, shooting: 25, passing: 40, stamina: 20 },
            { month: 'Mar', dribbling: 50, shooting: 40, passing: 60, stamina: 30 },
            { month: 'Apr', dribbling: 80, shooting: 60, passing: 75, stamina: 45 },
            { month: 'May', dribbling: 100, shooting: 80, passing: 90, stamina: 60 }
        ],
        achievements: [
            { id: 1, title: 'First Training Session', date: '2023-05-10', icon: faCalendarAlt },
            { id: 2, title: 'Reach Level 5', date: '2023-05-15', icon: faTrophy },
            { id: 3, title: '7-Day Streak', date: '2023-05-22', icon: faFire },
            { id: 4, title: 'Master Dribbling Level 1', date: '2023-05-28', icon: faFutbol },
            { id: 5, title: 'Complete 10 Training Sessions', date: '2023-06-02', icon: faCalendarDay }
        ]
    };

    // Get all available skills from userData
    const userSkills = userData.skills || {};
    const userSkillLevels = userData.skillLevels || {};
    
    // Create a map of all skills with their icons and colors
    const skillsMap = {};
    const defaultIcons = [faFutbol, faRunning, faBullseye, faRandom, faTrophy];
    const defaultColors = ['#007bff', '#28a745', '#dc3545', '#fd7e14', '#6f42c1', '#fd7e14', '#20c997', '#17a2b8'];
    let colorIndex = 0;
    let iconIndex = 0;
    
    Object.keys(userSkills).forEach(skillName => {
        skillsMap[skillName] = {
            name: skillName,
            icon: defaultIcons[iconIndex % defaultIcons.length],
            color: defaultColors[colorIndex % defaultColors.length]
        };
        colorIndex++;
        iconIndex++;
    });

    // Convert the skillsMap back to an array for use in components
    const allSkills = Object.values(skillsMap);

    // Prepare data for radar chart - use all skills from user data
    const radarData = Object.keys(userSkillLevels).length > 0 
        ? Object.keys(userSkillLevels).map(skillName => {
            const skillInfo = skillsMap[skillName] || { 
                name: skillName,
                color: defaultColors[colorIndex++ % defaultColors.length]
            };
            
            return {
                subject: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                value: userSkillLevels[skillName] || 1,
                fullMark: 10,
                color: skillInfo.color
            };
        })
        : allSkills.map(skill => ({
            subject: skill.name.charAt(0).toUpperCase() + skill.name.slice(1),
            value: userSkillLevels[skill.name] || 1,
            fullMark: 10,
            color: skill.color
        }));

    // Prepare data for skill distribution pie chart - use all skills from user data
    const pieData = Object.keys(userSkills).length > 0
        ? Object.keys(userSkills).map(skillName => {
            const skillInfo = skillsMap[skillName] || { 
                name: skillName,
                color: defaultColors[colorIndex++ % defaultColors.length]
            };
            
            return {
                name: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                value: userSkills[skillName] || 0,
                color: skillInfo.color
            };
        })
        : allSkills.map(skill => ({
            name: skill.name.charAt(0).toUpperCase() + skill.name.slice(1),
            value: userSkills[skill.name] || 0,
            color: skill.color
        }));

    if (pieData.length === 0) {
        pieData.push({
            name: 'No skills yet',
            value: 1,
            color: '#cccccc'
        });
    }

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
    
    // Calculate the highest skill level
    const highestSkill = allSkills.reduce((highest, skill) => {
        const level = userSkillLevels[skill.name] || 1;
        if (level > (highest.level || 0)) {
            return { name: skill.name, level };
        }
        return highest;
    }, { level: 0 });

    // Get active time data based on selected timeframe
    const getActiveTimeData = () => {
        switch(timeFrame) {
            case 'week':
                return trainingData.lastWeek;
            case 'month':
                return trainingData.lastMonth;
            case 'average':
                // For weekly average, we'll return a different format
                // We want to show a 4-week rolling average with proper date ranges
                const today = new Date();
                const fourWeeksAgo = new Date(today);
                fourWeeksAgo.setDate(today.getDate() - 28);
                
                // Create date ranges for each week (going backwards from today)
                const weekRanges = [];
                for (let i = 0; i < 4; i++) {
                    const endDate = new Date(today);
                    endDate.setDate(today.getDate() - (i * 7));
                    
                    const startDate = new Date(endDate);
                    startDate.setDate(endDate.getDate() - 6);
                    
                    // Format as "MM/DD - MM/DD"
                    const startFormatted = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
                    const endFormatted = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
                    
                    weekRanges.push({
                        range: `${startFormatted} - ${endFormatted}`,
                        startDate,
                        endDate,
                        minutes: 0,
                        count: 0
                    });
                }
                
                // Calculate average minutes for each week range
                // Use the session data from skillProgressData if available
                if (skillProgressData.sessions && skillProgressData.sessions.length > 0) {
                    skillProgressData.sessions.forEach(session => {
                        if (!session.date) return;
                        
                        const sessionDate = new Date(session.date);
                        
                        // Find which week range this session belongs to
                        weekRanges.forEach(weekRange => {
                            if (sessionDate >= weekRange.startDate && sessionDate <= weekRange.endDate) {
                                weekRange.minutes += (session.duration || 0);
                                weekRange.count++;
                            }
                        });
                    });
                } else {
                    // Fallback to mock data if no real sessions are available
                    // Distribute the mock data across the week ranges
                    trainingData.lastWeek.forEach((day, index) => {
                        if (day.minutes > 0) {
                            weekRanges[0].minutes += day.minutes;
                            weekRanges[0].count++;
                        }
                    });
                    
                    // Add some mock data for previous weeks
                    for (let i = 1; i < 4; i++) {
                        weekRanges[i].minutes = Math.round(120 + Math.random() * 60);
                        weekRanges[i].count = 3 + Math.floor(Math.random() * 3);
                    }
                }
                
                // Calculate the average minutes per active day for each week
                return weekRanges.map(week => ({
                    date: week.range,
                    minutes: week.count > 0 ? Math.round(week.minutes / week.count) : 0
                })).reverse(); // Reverse to show oldest to newest
                
            default:
                return trainingData.lastWeek;
        }
    };

    const renderTimeframeSelector = () => (
        <div className="btn-group mb-3">
            <button 
                className={`btn btn-sm ${timeFrame === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeFrame('week')}
            >
                Week
            </button>
            <button 
                className={`btn btn-sm ${timeFrame === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeFrame('month')}
            >
                Month
            </button>
            <button 
                className={`btn btn-sm ${timeFrame === 'average' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setTimeFrame('average')}
            >
                Weekly Avg
            </button>
        </div>
    );

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
                                className={`nav-link ${activeTab === 'progress' ? 'active' : ''}`}
                                onClick={() => setActiveTab('progress')}
                            >
                                <FontAwesomeIcon icon={faChartArea} className="me-1" />
                                Progress Charts
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
                                <h6 className="mb-3">Skill Balance</h6>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    // Position the label further out from the pie
                                                    const radius = outerRadius + 15;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                    
                                                    return (
                                                        <text 
                                                            x={x} 
                                                            y={y} 
                                                            fill={pieData[index].color}
                                                            textAnchor={x > cx ? 'start' : 'end'} 
                                                            dominantBaseline="central"
                                                            fontSize="12"
                                                        >
                                                            {name}
                                                        </text>
                                                    );
                                                }}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
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
                                <div className="mt-4" style={{ height: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={trainingData.lastWeek}
                                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="minutes" fill="#009688" name="Minutes" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                {/* Latest Session Section */}
                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">Latest Session</h6>
                                    {latestSession ? (
                                        <div className="d-flex align-items-center">
                                            <div className="me-3 bg-warning text-white rounded p-2">
                                                <FontAwesomeIcon icon={faCalendarDay} />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between">
                                                    <strong>{latestSession.title || 'Training Session'}</strong>
                                                    <span className="badge bg-primary">{latestSession.duration} mins</span>
                                                </div>
                                                <div className="small text-muted">
                                                    {latestSession.date} at {latestSession.time}
                                                </div>
                                                {latestSession.skillsChanged && latestSession.skillsChanged.length > 0 && (
                                                    <div className="small mt-1">
                                                        <span className="text-muted">Skills: </span>
                                                        {latestSession.skillsChanged.map(skill => (
                                                            <span key={skill} className="badge bg-light text-dark me-1 text-capitalize">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted small">No recent sessions found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Skill Radar</h5>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" />
                                            <PolarRadiusAxis angle={90} domain={[0, 10]} />
                                            <Radar
                                                name="Skill Level"
                                                dataKey="value"
                                                stroke="#009688"
                                                fill="#009688"
                                                fillOpacity={0.6}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-3">
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
                    {allSkills.map((skill) => {
                        const progress = userData.skills?.[skill.name] || 0;
                        const level = userData.skillLevels?.[skill.name] || 1;
                        const threshold = userData.skillThresholds?.[skill.name] || 100;
                        const progressPercentage = Math.min(100, (progress / threshold) * 100);
                        
                        // Calculate training history for this skill
                        const skillHistory = trainingData.lastWeek.map(day => ({
                            date: day.date,
                            value: day.skills[skill.name] || 0
                        }));

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
                                        <div style={{ height: "150px" }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart
                                                    data={skillHistory}
                                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="value" 
                                                        stroke={skill.color} 
                                                        fill={skill.color} 
                                                        fillOpacity={0.2}
                                                        name="Points" 
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="small text-muted mt-3">
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

            {activeTab === 'progress' && (
                <div className="row">
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title">
                                        <FontAwesomeIcon icon={faChartLine} className="me-2" />
                                        Training Activity
                                    </h5>
                                    {renderTimeframeSelector()}
                                </div>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {timeFrame === 'average' ? (
                                            <LineChart
                                                data={getActiveTimeData()}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="minutes" 
                                                    stroke="#009688" 
                                                    name="Avg. Minutes per Active Day" 
                                                    strokeWidth={2}
                                                    dot={{ r: 4 }}
                                                    activeDot={{ r: 8 }}
                                                />
                                            </LineChart>
                                        ) : (
                                            <AreaChart
                                                data={getActiveTimeData()}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey={timeFrame === 'week' ? 'date' : 'week'} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="minutes" 
                                                    stroke="#009688" 
                                                    fillOpacity={0.3} 
                                                    fill="#009688" 
                                                    name="Training Minutes" 
                                                />
                                            </AreaChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">
                                    <FontAwesomeIcon icon={faHistory} className="me-2" />
                                    Skill Progress Over Time
                                </h5>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={skillProgressData.monthlyProgress.length > 0 
                                                ? skillProgressData.monthlyProgress 
                                                : [{ date: 'Apr 20', fullDate: '2025-04-20', dribbling: 0, shooting: 0, passing: 0, stamina: 0, defending: 0, speed: 0 }]}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="date"
                                                interval="preserveStartEnd"
                                                tickFormatter={(value) => value}
                                            />
                                            <YAxis />
                                            <Tooltip 
                                                formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                                                labelFormatter={(label) => label}
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="dribbling" 
                                                stroke="#3498db" 
                                                name="Dribbling" 
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="passing" 
                                                stroke="#2ecc71" 
                                                name="Passing" 
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="defending" 
                                                stroke="#e74c3c" 
                                                name="Defending" 
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="speed" 
                                                stroke="#f39c12" 
                                                name="Speed" 
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="stamina" 
                                                stroke="#9b59b6" 
                                                name="Stamina" 
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="shooting" 
                                                stroke="#e67e22" 
                                                name="Shooting" 
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 5 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">
                                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                                    Skill Distribution
                                </h5>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={Object.keys(userData.skills || {}).length > 0 
                                                ? Object.keys(userData.skills).map(skillName => {
                                                    const skillInfo = skillsMap[skillName] || { 
                                                        name: skillName,
                                                        color: defaultColors[Math.floor(Math.random() * defaultColors.length)]
                                                    };
                                                    return {
                                                        name: skillName,
                                                        points: userData.skills[skillName] || 0,
                                                        color: skillInfo.color
                                                    };
                                                })
                                                : allSkills.map(skill => ({
                                                    name: skill.name,
                                                    points: userData.skills?.[skill.name] || 0,
                                                    color: skill.color
                                                }))}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`${value} points`, 'Skill Points']} />
                                            <Bar dataKey="points" name="Skill Points">
                                                {(Object.keys(userData.skills || {}).length > 0 
                                                    ? Object.keys(userData.skills).map(skillName => {
                                                        const skillInfo = skillsMap[skillName] || { 
                                                            color: defaultColors[Math.floor(Math.random() * defaultColors.length)]
                                                        };
                                                        return skillInfo.color;
                                                    })
                                                    : allSkills.map(skill => skill.color)
                                                ).map((color, index) => (
                                                    <Cell key={`cell-${index}`} fill={color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">
                                    <FontAwesomeIcon icon={faChartArea} className="me-2" />
                                    Level Progress
                                </h5>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="subject" />
                                            <PolarRadiusAxis angle={90} domain={[0, 10]} />
                                            <Radar
                                                name="Current Level"
                                                dataKey="value"
                                                stroke="#009688"
                                                fill="#009688"
                                                fillOpacity={0.6}
                                            />
                                            <Tooltip />
                                            <Legend />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'achievements' && (
                <div className="row">
                    <div className="col-12 mb-4">
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
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">Achievement Timeline</h5>
                                <div style={{ height: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={trainingData.achievements.map((achievement, index) => ({
                                                name: achievement.title,
                                                date: achievement.date,
                                                value: index + 1
                                            }))}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="stepAfter" dataKey="value" stroke="#ffc107" name="Achievements Completed" />
                                        </LineChart>
                                    </ResponsiveContainer>
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