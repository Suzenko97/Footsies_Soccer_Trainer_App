import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Config/firebase';
import { getUserProfile } from '../Services';
import { generateTrainingRecommendations } from '../Services/recommendationService';
import { getSkillImbalanceAnalysis } from '../Services/statService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLightbulb, faChartLine, faDumbbell, faGraduationCap, faExclamationTriangle, faCalendarAlt, faTrophy, faFire, faFutbol, faCalendarDay, faPlus, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import SessionForm from './SessionForm';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState([]);
    const [imbalanceAnalysis, setImbalanceAnalysis] = useState(null);
    const [showSessionForm, setShowSessionForm] = useState(false);

    // Mock training data for consistency with StatPage
    const mockAchievements = [
        { id: 1, title: 'First Training Session', date: '2023-05-10', icon: faCalendarAlt },
        { id: 2, title: 'Reach Level 5', date: '2023-05-15', icon: faTrophy },
        { id: 3, title: '7-Day Streak', date: '2023-05-22', icon: faFire },
        { id: 4, title: 'Master Dribbling Level 1', date: '2023-05-28', icon: faFutbol },
        { id: 5, title: 'Complete 10 Training Sessions', date: '2023-06-02', icon: faCalendarDay }
    ];

    // Define fetchUserData as a named function so it can be called from elsewhere
    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const profile = await getUserProfile(user.uid);
                if (!profile.xpThreshold) {
                    profile.xpThreshold = 100;
                }
                setUserData(profile);

                // Get recommendations
                const recs = await generateTrainingRecommendations(user.uid);
                setRecommendations(recs);

                // Get skill imbalance analysis
                const imbalance = await getSkillImbalanceAnalysis(user.uid);
                setImbalanceAnalysis(imbalance);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleSessionSaved = (sessionData) => {
        setShowSessionForm(false);
        // Refresh user data to reflect the new session
        fetchUserData();
    };

    const handleCancelSession = () => {
        setShowSessionForm(false);
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="container text-center mt-5">
                <div className="alert alert-primary" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    No user data found. Please log in again.
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Go to Login
                </button>
            </div>
        );
    }

    const progressPercentage = (userData.xp / userData.xpThreshold) * 100;

    return (
        <div className="container py-4">
            {showSessionForm && (
                <div className="modal-backdrop show" style={{ opacity: 0.5 }}></div>
            )}

            {showSessionForm && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Record Training Session</h5>
                                <button type="button" className="btn-close" onClick={handleCancelSession}></button>
                            </div>
                            <div className="modal-body">
                                <SessionForm 
                                    onSessionSaved={handleSessionSaved} 
                                    onCancel={handleCancelSession} 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-md-4 mb-4">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faUser} className="me-2" />
                                Profile
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="text-center mb-3">
                                <div className="rounded-circle bg-light d-inline-flex justify-content-center align-items-center" 
                                    style={{ width: "100px", height: "100px", fontSize: "3rem" }}>
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                            </div>
                            <h3 className="mb-3 text-center">{userData.username}</h3>
                            <p className="mb-2">
                                <i className="fas fa-star me-2 text-warning"></i>
                                Level {userData.level}
                            </p>
                            <div className="progress mb-3">
                                <div 
                                    className="progress-bar" 
                                    role="progressbar" 
                                    style={{ width: `${progressPercentage}%` }}
                                    aria-valuenow={progressPercentage} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                >
                                    {Math.round(progressPercentage)}%
                                </div>
                            </div>
                            <p className="text-muted mb-0">
                                XP: {userData.xp} / {userData.xpThreshold}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faDumbbell} className="me-2" />
                                Training Options
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-12 mb-3">
                                    <button 
                                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                        onClick={() => setShowSessionForm(true)}
                                        style={{ backgroundColor: '#009688', borderColor: '#00796b' }}
                                    >
                                        <FontAwesomeIcon icon={faStopwatch} className="me-2" />
                                        Record New Training Session
                                    </button>
                                </div>
                                <div className="col-12">
                                    <button 
                                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                        onClick={() => navigate('/skills')}
                                    >
                                        <FontAwesomeIcon icon={faGraduationCap} className="me-2" />
                                        Skills Training
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                                Stats Overview
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-sm-4">
                                    <div className="text-center">
                                        <h3>{userData.totalSessions || 0}</h3>
                                        <p className="text-muted mb-0">Total Sessions</p>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="text-center">
                                        <h3>{userData.skillPoints || 0}</h3>
                                        <p className="text-muted mb-0">Skill Points</p>
                                    </div>
                                </div>
                                <div className="col-sm-4">
                                    <div className="text-center">
                                        <h3>{mockAchievements.length}</h3>
                                        <p className="text-muted mb-0">Achievements</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Skill Imbalance Card */}
                    {imbalanceAnalysis && (
                        <div className="card mb-4">
                            <div className="card-header d-flex align-items-center" style={{ backgroundColor: '#009688', color: 'white' }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                <h5 className="mb-0">Skill Balance</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {/* Strongest/Weakest Skills */}
                                    <div className="col-md-6 text-center mb-3">
                                        <h6>Strongest</h6>
                                        {imbalanceAnalysis.strongestSkill.name !== "None" ? (
                                            <>
                                                <h4 style={{ color: '#009688' }}>
                                                    {imbalanceAnalysis.strongestSkill.name.charAt(0).toUpperCase() + imbalanceAnalysis.strongestSkill.name.slice(1)}
                                                </h4>
                                                <p>Level {imbalanceAnalysis.strongestSkill.level} ({imbalanceAnalysis.strongestSkill.value} XP)</p>
                                            </>
                                        ) : (
                                            <p className="text-muted">No skills trained yet</p>
                                        )}
                                    </div>
                                    <div className="col-md-6 text-center mb-3">
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
                                    
                                    {/* Imbalance Progress Bar */}
                                    <div className="col-12">
                                        <div className="d-flex justify-content-between mb-2">
                                            <small>Balanced</small>
                                            <small>Imbalanced</small>
                                        </div>
                                        <div className="progress mb-3">
                                            <div 
                                                className="progress-bar" 
                                                role="progressbar" 
                                                style={{ 
                                                    width: `${imbalanceAnalysis.imbalanceScore}%`,
                                                    backgroundColor: imbalanceAnalysis.imbalanceScore > 50 ? '#dc3545' : 
                                                                   imbalanceAnalysis.imbalanceScore > 20 ? '#ffc107' : '#28a745'
                                                }} 
                                                aria-valuenow={imbalanceAnalysis.imbalanceScore} 
                                                aria-valuemin="0" 
                                                aria-valuemax="100"
                                            ></div>
                                        </div>
                                        
                                        {/* Imbalance Message */}
                                        <div className={`alert ${imbalanceAnalysis.imbalanceScore > 50 ? 'alert-danger' : imbalanceAnalysis.imbalanceScore > 20 ? 'alert-warning' : 'alert-success'} mb-0`}>
                                            <div className="d-flex align-items-center">
                                                <FontAwesomeIcon 
                                                    icon={faExclamationTriangle} 
                                                    className="me-2" 
                                                    style={{ 
                                                        color: imbalanceAnalysis.imbalanceScore > 50 ? '#dc3545' : 
                                                               imbalanceAnalysis.imbalanceScore > 20 ? '#ffc107' : '#28a745'
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
                            </div>
                        </div>
                    )}
                    
                    {/* Recommendations Card */}
                    <div className="card">
                        <div className="card-header d-flex align-items-center" style={{ backgroundColor: '#009688', color: 'white' }}>
                            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                            <h5 className="mb-0">Training Recommendations</h5>
                        </div>
                        <div className="card-body">
                            {recommendations && recommendations.length > 0 ? (
                                <div>
                                    {recommendations.map((rec, index) => (
                                        <div key={index} className="alert mb-2" style={{ backgroundColor: '#e0f2f1', color: '#004d40' }}>
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
        </div>
    );
};

export default DashboardPage;
