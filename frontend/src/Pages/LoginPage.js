import React, { useState } from 'react';
import { auth } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.message);
        }
    };

    const handleSignupRedirect = () => {
        navigate('/signup');
    };

    return (
        <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="card shadow-sm" style={{ maxWidth: '500px' }}>
                <div className="card-header text-center py-4">
                    <h1 className="h3 mb-0">
                        <i className="fas fa-futbol me-2"></i>
                        Welcome to Footsies
                    </h1>
                </div>
                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <p className="text-muted">
                            Your personal AI-powered soccer training companion. Elevate your game with personalized training sessions and real-time feedback.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-circle me-2"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="fas fa-envelope"></i>
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
                                    <i className="fas fa-lock"></i>
                                </span>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-primary">
                                <i className="fas fa-sign-in-alt me-2"></i>
                                Sign In
                            </button>
                            <button type="button" className="btn btn-outline-primary" onClick={handleSignupRedirect}>
                                <i className="fas fa-user-plus me-2"></i>
                                Create New Account
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
