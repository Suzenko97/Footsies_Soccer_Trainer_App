// SignupPage.js
import React, { useState } from 'react';
import { auth } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // Redirect to dashboard after successful signup
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            console.error("Signup error:", err);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    style={{ padding: '8px' }}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    style={{ padding: '8px' }}
                />
                <button 
                    type="submit"
                    style={{ 
                        padding: '10px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Sign Up
                </button>
            </form>
            {error && <p style={{ color: "red", marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default SignupPage;