import React, { useState } from 'react';
import { auth } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUserProfile, isUsernameAvailable } from '../Services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faArrowLeft, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            if (username) {
                const available = await isUsernameAvailable(username);
                if (!available) {
                    setError("Username already taken. Please choose another one.");
                    return;
                }
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await createUserProfile(user.uid, { email, username });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="card shadow-sm" style={{ maxWidth: '500px' }}>
                <div className="card-header text-center py-4">
                    <h1 className="h3 mb-0">
                        <i className="fas fa-futbol me-2"></i>
                        Create Your Account
                    </h1>
                </div>
                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <p className="text-muted">
                            Join Footsies and start your personalized soccer training journey today.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <FontAwesomeIcon icon={faUser} className="me-2" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Username</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <FontAwesomeIcon icon={faUser} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </span>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <FontAwesomeIcon icon={faLock} />
                                </span>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    required
                                />
                            </div>
                            <div className="form-text">
                                Password must be at least 6 characters long
                            </div>
                        </div>

                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-primary">
                                <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                                Create Account
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary"
                                onClick={() => navigate('/login')}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                Back to Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;