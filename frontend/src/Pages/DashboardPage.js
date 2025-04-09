import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../Config/firebase';
import { getUserProfile } from '../Services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    if (!profile.xpThreshold) {
                        profile.xpThreshold = 100;
                    }
                    setUserData(profile);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, []);
    
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
                                <i className="fas fa-dumbbell me-2"></i>
                                Training Options
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-12">
                                    <button 
                                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                        onClick={() => navigate('/skills')}
                                    >
                                        <i className="fas fa-graduation-cap me-2"></i>
                                        Skills Training
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="fas fa-chart-line me-2"></i>
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
                                        <h3>{userData.achievements?.length || 0}</h3>
                                        <p className="text-muted mb-0">Achievements</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
