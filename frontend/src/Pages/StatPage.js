import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth } from "../Config/firebase";
import { 
  getUserProfile, 
  updateUserSkills, 
  updateUserProgress,
  getTrainingFrequencyStats,
  getSkillProgressStats,
  getTimeSinceLastImprovement,
  getSkillImbalanceAnalysis,
  generateTrainingRecommendations,
  generateSkillRecommendations
} from "../Services";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faExclamationTriangle, 
  faLightbulb,
  faDumbbell,
  faCalendarAlt,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const StatPage = () => {
    const { skill } = useParams(); // Get skill name from URL
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quests, setQuests] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [skillStats, setSkillStats] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [frequencyStats, setFrequencyStats] = useState(null);
    const [lastImprovement, setLastImprovement] = useState(null);
    const [imbalanceAnalysis, setImbalanceAnalysis] = useState(null);
    const [currentSkill, setCurrentSkill] = useState('overall');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    setUserData(profile);
                    
                    // If skill is provided in URL, use it, otherwise use 'overall'
                    const skillToUse = skill || currentSkill;
                    setCurrentSkill(skillToUse);
                    
                    if (skillToUse !== 'overall') {
                        generateQuests(profile.skills[skillToUse] || 0);
                    }
                    
                    // Fetch stats and recommendations
                    const frequency = await getTrainingFrequencyStats(user.uid);
                    setFrequencyStats(frequency);
                    
                    if (skillToUse !== 'overall') {
                        const progress = await getSkillProgressStats(user.uid);
                        setSkillStats(progress[skillToUse] || []);
                        
                        // Get skill-specific recommendations
                        const recs = await generateSkillRecommendations(user.uid, skillToUse);
                        setRecommendations(recs);
                    } else {
                        // For overall stats, get general recommendations
                        const recs = await generateTrainingRecommendations(user.uid);
                        setRecommendations(recs);
                        
                        // For overall view, create data for skill comparison
                        console.log("User profile for skill comparison:", profile);
                        
                        // Make sure we have skills data and it's in the right format
                        if (profile && profile.skills) {
                            const skillComparisonData = [];
                            
                            // Explicitly check for each skill to ensure we have data
                            const skillNames = ['dribbling', 'shooting', 'passing', 'defending', 'speed', 'stamina'];
                            
                            skillNames.forEach(skillName => {
                                // Use the skillLevels property directly instead of calculating
                                const skillLevel = profile.skillLevels?.[skillName] || 1;
                                
                                skillComparisonData.push({
                                    name: skillName.charAt(0).toUpperCase() + skillName.slice(1),
                                    value: skillLevel
                                });
                            });
                            
                            console.log("Skill comparison data (using skillLevels):", skillComparisonData);
                            setSkillStats(skillComparisonData);
                        } else {
                            console.error("No skills data found in user profile");
                            setSkillStats([]);
                        }
                    }
                    
                    const improvement = await getTimeSinceLastImprovement(user.uid);
                    setLastImprovement(improvement);
                    
                    const imbalance = await getSkillImbalanceAnalysis(user.uid);
                    setImbalanceAnalysis(imbalance);
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
        const updatedSkillXP = userData.skills[currentSkill] + xpGained;
        const updatedXP = userData.xp + xpGained;
        let updatedLevel = userData.level;
        
        if (updatedXP >= 100) {
            updatedLevel += 1;
        }
        
        await updateUserSkills(auth.currentUser.uid, { ...userData.skills, [currentSkill]: updatedSkillXP });
        await updateUserProgress(auth.currentUser.uid, updatedXP, updatedLevel);
        setUserData({ ...userData, skills: { ...userData.skills, [currentSkill]: updatedSkillXP }, xp: updatedXP, level: updatedLevel });
    };

    if (loading) {
        return (
            <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "20px" }}>
            <h2>{currentSkill.charAt(0).toUpperCase() + currentSkill.slice(1)} Training</h2>
            
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        style={{ 
                            border: 'none', 
                            background: activeTab === 'overview' ? '#f8f9fa' : 'transparent',
                            borderBottom: activeTab === 'overview' ? '2px solid #007bff' : 'none',
                            padding: '10px 15px'
                        }}
                    >
                        Overview
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                        style={{ 
                            border: 'none', 
                            background: activeTab === 'stats' ? '#f8f9fa' : 'transparent',
                            borderBottom: activeTab === 'stats' ? '2px solid #007bff' : 'none',
                            padding: '10px 15px'
                        }}
                    >
                        <FontAwesomeIcon icon={faChartLine} className="me-2" />
                        Stats
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'recommendations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recommendations')}
                        style={{ 
                            border: 'none', 
                            background: activeTab === 'recommendations' ? '#f8f9fa' : 'transparent',
                            borderBottom: activeTab === 'recommendations' ? '2px solid #007bff' : 'none',
                            padding: '10px 15px'
                        }}
                    >
                        <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                        Recommendations
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'quests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quests')}
                        style={{ 
                            border: 'none', 
                            background: activeTab === 'quests' ? '#f8f9fa' : 'transparent',
                            borderBottom: activeTab === 'quests' ? '2px solid #007bff' : 'none',
                            padding: '10px 15px'
                        }}
                    >
                        <FontAwesomeIcon icon={faTrophy} className="me-2" />
                        Quests
                    </button>
                </li>
            </ul>
            
            {activeTab === 'overview' && (
                <div>
                    <div className="card mb-4">
                        <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'var(--teal-primary)', color: 'var(--text-light)' }}>
                            <FontAwesomeIcon icon={faChartLine} className="me-2" />
                            <h5 className="mb-0">Overall Training Progress</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span>Account Level: {userData?.level || 1}</span>
                                    <span>{userData?.xp || 0} / {userData?.xpThreshold || 100}</span>
                                </div>
                                <div className="progress">
                                    <div 
                                        className="progress-bar" 
                                        role="progressbar" 
                                        style={{ 
                                            width: `${userData ? (userData.xp / userData.xpThreshold) * 100 : 0}%`,
                                            backgroundColor: 'var(--teal-primary)'
                                        }} 
                                        aria-valuenow={userData?.xp || 0} 
                                        aria-valuemin="0" 
                                        aria-valuemax={userData?.xpThreshold || 100}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Training Frequency Card */}
                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'var(--teal-primary)', color: 'var(--text-light)' }}>
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                    <h5 className="mb-0">Training Frequency</h5>
                                </div>
                                <div className="card-body">
                                    {frequencyStats ? (
                                        <div className="row text-center">
                                            <div className="col-6">
                                                <h2>{frequencyStats.weeklySessions}</h2>
                                                <p className="text-muted">This Week</p>
                                            </div>
                                            <div className="col-6">
                                                <h2>{frequencyStats.totalSessions}</h2>
                                                <p className="text-muted">Total</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3">
                                            <p className="text-muted">No training data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Skill Imbalance Card */}
                        <div className="col-md-6 mb-4">
                            <div className="card">
                                <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'var(--teal-primary)', color: 'var(--text-light)' }}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                    <h5 className="mb-0">Skill Balance</h5>
                                </div>
                                <div className="card-body">
                                    {imbalanceAnalysis ? (
                                        <div className="row">
                                            <div className="col-md-6 text-center">
                                                <h6>Strongest</h6>
                                                {imbalanceAnalysis.strongestSkill.name !== "None" ? (
                                                    <>
                                                        <h4 style={{ color: 'var(--teal-primary)' }}>
                                                            {imbalanceAnalysis.strongestSkill.name.charAt(0).toUpperCase() + imbalanceAnalysis.strongestSkill.name.slice(1)}
                                                        </h4>
                                                        <p>Level {imbalanceAnalysis.strongestSkill.level} ({imbalanceAnalysis.strongestSkill.value} XP)</p>
                                                    </>
                                                ) : (
                                                    <p className="text-muted">No skills trained yet</p>
                                                )}
                                            </div>
                                            <div className="col-md-6 text-center">
                                                <h6>Weakest</h6>
                                                {imbalanceAnalysis.weakestSkill.name !== "None" ? (
                                                    <>
                                                        <h4 className="text-danger">
                                                            {imbalanceAnalysis.weakestSkill.name.charAt(0).toUpperCase() + imbalanceAnalysis.weakestSkill.name.slice(1)}
                                                        </h4>
                                                        <p>Level {imbalanceAnalysis.weakestSkill.level} ({imbalanceAnalysis.weakestSkill.value} XP)</p>
                                                    </>
                                                ) : (
                                                    <p className="text-muted">No skills trained yet</p>
                                                )}
                                            </div>
                                            
                                            {/* Radar Chart for Skill Distribution */}
                                            <div className="col-12 mt-3">
                                                <h6 className="text-center mb-3">Skill Distribution</h6>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <RadarChart outerRadius={120} data={skillStats}>
                                                        <PolarGrid gridType="circle" />
                                                        <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--teal-dark)' }} />
                                                        <PolarRadiusAxis 
                                                            angle={30} 
                                                            domain={[0, 10]}
                                                            axisLine={false}
                                                            tick={{ fill: 'var(--teal-dark)' }}
                                                        />
                                                        <Radar
                                                            name="Skills"
                                                            dataKey="value"
                                                            stroke="var(--teal-primary)"
                                                            fill="var(--teal-primary)"
                                                            fillOpacity={0.7}
                                                            strokeWidth={2}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                backgroundColor: 'white', 
                                                                borderColor: 'var(--teal-primary)' 
                                                            }} 
                                                        />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3">
                                            <p className="text-muted">Loading skill balance data...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations Card */}
                    <div className="card mb-4">
                        <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'var(--teal-primary)', color: 'var(--text-light)' }}>
                            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                            <h5 className="mb-0">Top Recommendations</h5>
                        </div>
                        <div className="card-body">
                            {recommendations && recommendations.length > 0 ? (
                                <div>
                                    {recommendations.map((rec, index) => (
                                        <div key={index} className="alert mb-2" style={{ backgroundColor: 'var(--teal-light)', color: 'var(--teal-dark)' }}>
                                            <p className="mb-1"><strong>{rec.title}</strong></p>
                                            <small>{rec.description}</small>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted text-center">No recommendations available yet. Complete more training sessions to get personalized recommendations.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'stats' && (
                <div>
                    <div style={{ 
                        background: 'white', 
                        padding: '20px', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        marginBottom: '20px'
                    }}>
                        <h4>
                            <FontAwesomeIcon icon={faChartLine} className="me-2" />
                            {currentSkill === 'overall' ? 'Overall Progress' : `${currentSkill.charAt(0).toUpperCase() + currentSkill.slice(1)} Progress`}
                        </h4>
                        {skillStats && skillStats.length > 0 ? (
                            <div>
                                {currentSkill === 'overall' ? (
                                    <div>
                                        <h5>Skill Levels</h5>
                                        <div style={{ 
                                            height: '300px', 
                                            background: '#f8f9fa',
                                            borderRadius: '8px',
                                            marginTop: '15px',
                                            padding: '10px'
                                        }}>
                                            {skillStats && skillStats.length > 0 && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={skillStats}
                                                        margin={{
                                                            top: 20,
                                                            right: 30,
                                                            left: 20,
                                                            bottom: 20,
                                                        }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis domain={[0, 10]} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="value" fill="var(--teal-primary)" name="Skill Level" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                                            <div>
                                                <h5>Current Level: {userData?.skills[currentSkill]}</h5>
                                            </div>
                                            {skillStats.length > 1 && (
                                                <div>
                                                    <h5>
                                                        30-day Change: 
                                                        <span style={{ 
                                                            color: skillStats[skillStats.length - 1].value - skillStats[0].value > 0 ? '#28a745' : '#dc3545',
                                                            marginLeft: '5px'
                                                        }}>
                                                            {(skillStats[skillStats.length - 1].value - skillStats[0].value).toFixed(1)}
                                                        </span>
                                                    </h5>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div style={{ 
                                            height: '300px', 
                                            background: '#f8f9fa',
                                            borderRadius: '8px',
                                            marginTop: '15px',
                                            padding: '10px'
                                        }}>
                                            {skillStats && skillStats.length > 0 && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart
                                                        data={skillStats}
                                                        margin={{
                                                            top: 20,
                                                            right: 30,
                                                            left: 20,
                                                            bottom: 20,
                                                        }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis domain={[0, 10]} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="value" 
                                                            stroke="var(--teal-primary)" 
                                                            name={`${currentSkill.charAt(0).toUpperCase() + currentSkill.slice(1)} Progress`} 
                                                            activeDot={{ r: 8 }} 
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ 
                                textAlign: 'center',
                                padding: '30px'
                            }}>
                                <p>No skill data available to display</p>
                                <small style={{ color: '#6c757d' }}>Complete training sessions to see progress</small>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatPage;