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
  generateSkillRecommendations,
  getLastTrainingSession
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
    const [skillStats, setSkillStats] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [frequencyStats, setFrequencyStats] = useState(null);
    const [lastImprovement, setLastImprovement] = useState(null);
    const [imbalanceAnalysis, setImbalanceAnalysis] = useState(null);
    const [currentSkill, setCurrentSkill] = useState('overall');
    const [lastSession, setLastSession] = useState(null);

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
                    
                    // Fetch stats and recommendations
                    const frequency = await getTrainingFrequencyStats(user.uid);
                    setFrequencyStats(frequency);
                    
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
                    
                    // Get general recommendations
                    const recs = await generateTrainingRecommendations(user.uid);
                    setRecommendations(recs);
                    
                    const improvement = await getTimeSinceLastImprovement(user.uid);
                    setLastImprovement(improvement);
                    
                    const imbalance = await getSkillImbalanceAnalysis(user.uid);
                    setImbalanceAnalysis(imbalance);
                    
                    const lastSessionData = await getLastTrainingSession(user.uid);
                    setLastSession(lastSessionData);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [skill]);

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
            <h2>Training Statistics</h2>
            
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
                                    <div>
                                        <div className="row text-center mb-3">
                                            <div className="col-4">
                                                <h2>{frequencyStats.dailySessions}</h2>
                                                <p className="text-muted">Today</p>
                                            </div>
                                            <div className="col-4">
                                                <h2>{frequencyStats.weeklySessions}</h2>
                                                <p className="text-muted">This Week</p>
                                            </div>
                                            <div className="col-4">
                                                <h2>{frequencyStats.monthlySessions}</h2>
                                                <p className="text-muted">This Month</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4">
                                            <h6 className="text-center mb-3" style={{ color: 'var(--teal-dark)' }}>Training Activity</h6>
                                            
                                            {/* Tabs for different graph views */}
                                            <ul className="nav nav-tabs mb-3" id="trainingTabs" role="tablist">
                                                <li className="nav-item" role="presentation">
                                                    <button 
                                                        className="nav-link active" 
                                                        id="daily-tab" 
                                                        data-bs-toggle="tab" 
                                                        data-bs-target="#daily" 
                                                        type="button" 
                                                        role="tab" 
                                                        aria-controls="daily" 
                                                        aria-selected="true"
                                                        style={{ color: 'var(--teal-dark)' }}
                                                    >
                                                        Daily
                                                    </button>
                                                </li>
                                                <li className="nav-item" role="presentation">
                                                    <button 
                                                        className="nav-link" 
                                                        id="weekly-tab" 
                                                        data-bs-toggle="tab" 
                                                        data-bs-target="#weekly" 
                                                        type="button" 
                                                        role="tab" 
                                                        aria-controls="weekly" 
                                                        aria-selected="false"
                                                        style={{ color: 'var(--teal-dark)' }}
                                                    >
                                                        Weekly
                                                    </button>
                                                </li>
                                                <li className="nav-item" role="presentation">
                                                    <button 
                                                        className="nav-link" 
                                                        id="monthly-tab" 
                                                        data-bs-toggle="tab" 
                                                        data-bs-target="#monthly" 
                                                        type="button" 
                                                        role="tab" 
                                                        aria-controls="monthly" 
                                                        aria-selected="false"
                                                        style={{ color: 'var(--teal-dark)' }}
                                                    >
                                                        Monthly
                                                    </button>
                                                </li>
                                                <li className="nav-item" role="presentation">
                                                    <button 
                                                        className="nav-link" 
                                                        id="average-tab" 
                                                        data-bs-toggle="tab" 
                                                        data-bs-target="#average" 
                                                        type="button" 
                                                        role="tab" 
                                                        aria-controls="average" 
                                                        aria-selected="false"
                                                        style={{ color: 'var(--teal-dark)' }}
                                                    >
                                                        Average
                                                    </button>
                                                </li>
                                            </ul>
                                            
                                            {/* Tab content */}
                                            <div className="tab-content" id="trainingTabsContent">
                                                {/* Daily Tab */}
                                                <div 
                                                    className="tab-pane fade show active" 
                                                    id="daily" 
                                                    role="tabpanel" 
                                                    aria-labelledby="daily-tab"
                                                >
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <BarChart
                                                            data={frequencyStats.hourlyData || []}
                                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis 
                                                                dataKey="name" 
                                                                tick={{ fontSize: 10 }}
                                                                interval={3} // Show every 4th label to avoid crowding
                                                            />
                                                            <YAxis 
                                                                domain={[0, 5]} // Set y-axis max to 5
                                                                allowDecimals={false}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ 
                                                                    backgroundColor: 'white', 
                                                                    borderColor: 'var(--teal-primary)' 
                                                                }}
                                                                formatter={(value) => [`${value} session(s)`, 'Count']}
                                                                labelFormatter={(label) => `Time: ${label}`}
                                                            />
                                                            <Bar 
                                                                dataKey="value" 
                                                                fill="var(--teal-primary)" 
                                                                name="Sessions"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    
                                                </div>
                                                
                                                {/* Weekly Tab */}
                                                <div 
                                                    className="tab-pane fade" 
                                                    id="weekly" 
                                                    role="tabpanel" 
                                                    aria-labelledby="weekly-tab"
                                                >
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <BarChart
                                                            data={frequencyStats.weeklyData || []}
                                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis 
                                                                dataKey="name" 
                                                                tick={{ fontSize: 10 }}
                                                            />
                                                            <YAxis 
                                                                domain={[0, 10]} 
                                                                allowDecimals={false}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ 
                                                                    backgroundColor: 'white', 
                                                                    borderColor: 'var(--teal-primary)' 
                                                                }}
                                                                formatter={(value) => [`${value} session(s)`, 'Count']}
                                                                labelFormatter={(label) => `${label}`}
                                                            />
                                                            <Bar 
                                                                dataKey="value" 
                                                                fill="var(--teal-primary)" 
                                                                name="Sessions"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    
                                                </div>
                                                
                                                {/* Monthly Tab */}
                                                <div 
                                                    className="tab-pane fade" 
                                                    id="monthly" 
                                                    role="tabpanel" 
                                                    aria-labelledby="monthly-tab"
                                                >
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <BarChart
                                                            data={frequencyStats.yearlyData || []}
                                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis 
                                                                dataKey="name" 
                                                                tick={{ fontSize: 10 }}
                                                            />
                                                            <YAxis 
                                                                domain={[0, 50]} 
                                                                allowDecimals={false}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ 
                                                                    backgroundColor: 'white', 
                                                                    borderColor: 'var(--teal-primary)' 
                                                                }}
                                                                formatter={(value) => [`${value} session(s)`, 'Count']}
                                                                labelFormatter={(label) => `Month: ${label}`}
                                                            />
                                                            <Bar 
                                                                dataKey="value" 
                                                                fill="var(--teal-primary)" 
                                                                name="Sessions"
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    
                                                </div>
                                                
                                                {/* Average Tab */}
                                                <div 
                                                    className="tab-pane fade" 
                                                    id="average" 
                                                    role="tabpanel" 
                                                    aria-labelledby="average-tab"
                                                >
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <LineChart
                                                            data={frequencyStats.weeklyAverageData || []}
                                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                                        >
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis 
                                                                dataKey="name" 
                                                                tick={{ fontSize: 9 }}
                                                                angle={-15}
                                                                textAnchor="end"
                                                                height={50}
                                                            />
                                                            <YAxis 
                                                                domain={[0, 5]} 
                                                                allowDecimals={true}
                                                            />
                                                            <Tooltip 
                                                                contentStyle={{ 
                                                                    backgroundColor: 'white', 
                                                                    borderColor: 'var(--teal-primary)' 
                                                                }}
                                                                formatter={(value) => [`${value} sessions/day`, 'Average']}
                                                                labelFormatter={(label) => `Week: ${label}`}
                                                            />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="value" 
                                                                stroke="var(--teal-primary)" 
                                                                strokeWidth={2}
                                                                activeDot={{ r: 8 }}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                    
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {lastImprovement && (
                                            <div className="col-12 mt-3">
                                                <p className="text-muted text-center">
                                                    Last skill improvement: {lastImprovement.daysAgo === 0 ? 'Today' : `${lastImprovement.daysAgo} days ago`}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {/* Last Training Session */}
                                        {lastSession && (
                                            <div className="col-12 mt-3">
                                                <div className="card border-0 bg-light">
                                                    <div className="card-header bg-light text-center">
                                                        <h6 className="mb-0" style={{ color: 'var(--teal-dark)' }}>Last Training Session</h6>
                                                        <small className="text-muted">
                                                            {lastSession.date} at {lastSession.time} 
                                                            <span className="ms-1 badge bg-light text-dark border">
                                                                Duration: {Math.round(lastSession.duration / 60)} {Math.round(lastSession.duration / 60) === 1 ? 'minute' : 'minutes'}
                                                            </span>
                                                        </small>
                                                    </div>
                                                    <div className="card-body p-2">
                                                        {lastSession.skillsChanged && lastSession.skillsChanged.length > 0 ? (
                                                            <div className="row">
                                                                {lastSession.skillsChanged.map((skill, index) => (
                                                                    <div key={index} className="col-6 mb-2">
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <span className="text-capitalize">
                                                                                {skill}:
                                                                            </span>
                                                                            <span className="badge bg-success">
                                                                                +{lastSession.metrics[skill]} XP
                                                                            </span>
                                                                        </div>
                                                                        <div className="progress" style={{ height: "6px" }}>
                                                                            <div 
                                                                                className="progress-bar" 
                                                                                role="progressbar" 
                                                                                style={{ 
                                                                                    width: `${Math.min(100, (lastSession.metrics[skill] / 100) * 100)}%`,
                                                                                    backgroundColor: 'var(--teal-primary)'
                                                                                }}
                                                                                aria-valuenow={lastSession.metrics[skill]} 
                                                                                aria-valuemin="0" 
                                                                                aria-valuemax="100"
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-center text-muted mb-0">No skills improved in this session</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-3">
                                        <p className="text-muted">No training data available yet</p>
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
                                            <h6 className="text-center mb-3" style={{ color: 'var(--teal-dark)' }}>Skill Distribution</h6>
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
                                        
                                        {/* Imbalance Message */}
                                        <div className="col-12 mt-3">
                                            <div className={`alert ${imbalanceAnalysis.imbalanceScore > 50 ? 'alert-danger' : imbalanceAnalysis.imbalanceScore > 20 ? 'alert-warning' : 'alert-success'}`}>
                                                <div className="d-flex align-items-center">
                                                    <FontAwesomeIcon 
                                                        icon={faExclamationTriangle} 
                                                        className="me-2" 
                                                        style={{ 
                                                            color: imbalanceAnalysis.imbalanceScore > 50 ? 'var(--danger)' : 
                                                                   imbalanceAnalysis.imbalanceScore > 20 ? 'var(--warning)' : 'var(--success)'
                                                        }} 
                                                    />
                                                    <div>
                                                        <p className="mb-1"><strong>Imbalance Score: {imbalanceAnalysis.imbalanceScore.toFixed(1)}/100</strong></p>
                                                        <p className="mb-0">{imbalanceAnalysis.imbalanceMessage}</p>
                                                    </div>
                                                </div>
                                            </div>
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
                                        <p className="mb-1"><strong>{rec.message}</strong></p>
                                        <small>{rec.actionable}</small>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted text-center">No recommendations available yet. Complete more training sessions to get personalized recommendations.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatPage;