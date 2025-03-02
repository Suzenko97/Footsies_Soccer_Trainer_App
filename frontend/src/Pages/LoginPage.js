import React, { useState } from 'react';
import { auth } from '../Config/firebase';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth'; //

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            //Redirect to dashboard after login
            navigate('/dashboard');
        }
        catch (err) {
            setError(err.message);
            console.error("Login error:", err); // Debug log //
        }
    };

    const handleSignupRedirect = () => {
        navigate('/signup'); // Redirect to the signup page
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <div>
                <h1>Welcome to Footsies</h1>
                <p>
                    Footsies is a next-generation digital soccer coaching platform that combines traditional training methods with cutting-edge AI and interactive technologies. 
                    Designed for players of all skill levels, Footsies offers a personalized, gamified, and immersive training experience that adapts to your unique needs and goals.
                </p>
            </div>

            <h2>Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                    Login
                </button>
            </form>
            {error && <p style={{ color: "red", marginTop: '10px' }}>{error}</p>}

            {/* Signup button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p>Don't have an account? <button 
                    onClick={handleSignupRedirect}
                    style={{ 
                        backgroundColor: 'transparent', 
                        border: 'none', 
                        color: '#007bff', 
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    Sign Up
                </button></p>
            </div>
        </div>
    );
};

export default LoginPage;
