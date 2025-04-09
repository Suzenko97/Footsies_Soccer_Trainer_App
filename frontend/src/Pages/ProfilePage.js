import React, { useState, useEffect } from 'react';
import { auth } from '../Config/firebase';
import { getUserProfile, updateUserProfile } from '../Services/userService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        address: ''
    });
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userData = await getUserProfile(user.uid);
                    
                    if (userData) {
                        setProfile(userData);
                        setFormData({
                            username: userData.username || '',
                            email: user.email || '',
                            phone: userData.phone || '',
                            address: userData.address || ''
                        });
                    } else {
                        // Create default profile if none exists
                        const defaultProfile = {
                            username: user.displayName || 'Soccer Player',
                            email: user.email,
                            phone: '',
                            address: '',
                            skills: {
                                dribbling: 0,
                                shooting: 0,
                                passing: 0,
                                defending: 0,
                                speed: 0,
                                stamina: 0
                            },
                            level: 1,
                            xp: 0
                        };
                        setProfile(defaultProfile);
                        setFormData({
                            username: defaultProfile.username,
                            email: defaultProfile.email,
                            phone: defaultProfile.phone,
                            address: defaultProfile.address
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSaveProfile = async () => {
        try {
            setSaveStatus('Saving...');
            setLoading(true);
            const user = auth.currentUser;
            if (user) {
                await updateUserProfile(user.uid, {
                    phone: formData.phone,
                    address: formData.address
                });
                
                // Update local state
                setProfile({
                    ...profile,
                    phone: formData.phone,
                    address: formData.address
                });
                
                setEditing(false);
                setSaveStatus('Profile updated successfully!');
                setTimeout(() => setSaveStatus(''), 3000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            setSaveStatus('Error updating profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5 mt-5">
            <h1 className="mb-4 text-center">Player Profile</h1>
            <div className="row">
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <div className="rounded-circle bg-light d-inline-flex justify-content-center align-items-center" 
                                    style={{ width: "150px", height: "150px", fontSize: "4rem" }}>
                                    <FontAwesomeIcon icon={faUser} />
                                </div>
                            </div>
                            <h3>{profile?.username}</h3>
                            <p className="text-muted">Level {profile?.level || 1}</p>
                            <p>XP: {profile?.xp || 0} / {profile?.xpThreshold || 100}</p>
                            
                            {!editing ? (
                                <button 
                                    className="btn btn-outline-primary mt-2"
                                    onClick={() => setEditing(true)}
                                >
                                    <FontAwesomeIcon icon={faEdit} className="me-2" />
                                    Edit Profile
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="col-md-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3 className="mb-0">Profile Information</h3>
                        </div>
                        <div className="card-body">
                            {!editing ? (
                                <div>
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <p className="mb-0 fw-bold">Username</p>
                                        </div>
                                        <div className="col-sm-9">
                                            <p className="text-muted mb-0">{profile?.username}</p>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <p className="mb-0 fw-bold">Email</p>
                                        </div>
                                        <div className="col-sm-9">
                                            <p className="text-muted mb-0">{profile?.email}</p>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <p className="mb-0 fw-bold">Phone</p>
                                        </div>
                                        <div className="col-sm-9">
                                            <p className="text-muted mb-0">{profile?.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="row mb-3">
                                        <div className="col-sm-3">
                                            <p className="mb-0 fw-bold">Address</p>
                                        </div>
                                        <div className="col-sm-9">
                                            <p className="text-muted mb-0">{profile?.address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form>
                                    <div className="mb-3">
                                        <label htmlFor="username" className="form-label">Username</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="username" 
                                            name="username" 
                                            value={formData.username} 
                                            disabled
                                        />
                                        <small className="text-muted">Username cannot be changed</small>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            id="email" 
                                            name="email" 
                                            value={formData.email} 
                                            disabled
                                        />
                                        <small className="text-muted">Email cannot be changed</small>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="phone" className="form-label">Phone</label>
                                        <input 
                                            type="tel" 
                                            className="form-control" 
                                            id="phone" 
                                            name="phone" 
                                            value={formData.phone} 
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="address" className="form-label">Address</label>
                                        <textarea 
                                            className="form-control" 
                                            id="address" 
                                            name="address" 
                                            rows="3" 
                                            value={formData.address} 
                                            onChange={handleInputChange}
                                        ></textarea>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary" 
                                            onClick={() => setEditing(false)}
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="me-2" />
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-primary" 
                                            onClick={handleSaveProfile}
                                        >
                                            <FontAwesomeIcon icon={faSave} className="me-2" />
                                            Save
                                        </button>
                                    </div>
                                </form>
                            )}
                            
                            {saveStatus && (
                                <div className={`alert ${saveStatus.includes('Error') ? 'alert-danger' : 'alert-success'} mt-3`}>
                                    {saveStatus}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="mb-0">Skill Ratings</h3>
                        </div>
                        <div className="card-body">
                            {Object.entries(profile?.skills || {}).map(([skill, value]) => (
                                <div className="mb-3" key={skill}>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-capitalize">{skill}</span>
                                        <span>{value}/100</span>
                                    </div>
                                    <div className="progress" style={{ height: "10px" }}>
                                        <div 
                                            className={`progress-bar bg-${getProgressBarColor(skill)}`} 
                                            role="progressbar" 
                                            style={{ width: `${value}%` }} 
                                            aria-valuenow={value} 
                                            aria-valuemin="0" 
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to get different colors for different skills
const getProgressBarColor = (skill) => {
    const colors = {
        dribbling: 'success',
        shooting: 'danger',
        passing: 'info',
        defending: 'warning',
        speed: 'primary',
        stamina: 'secondary'
    };
    return colors[skill] || 'primary';
};

export default ProfilePage;