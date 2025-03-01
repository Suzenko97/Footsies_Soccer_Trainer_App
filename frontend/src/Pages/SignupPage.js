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

            <div>
                <h4>Why Footsies?</h4>
                <p>
                    Aspiring soccer players often face challenges like limited access to consistent coaching, high costs, and rigid schedules.
                    Footsies solves these problems by providing an accessible, engaging, and adaptive training platform that grows with you.
                    Whether you're a beginner or an advanced player, our AI-driven tools and expert-guided tutorials ensure you stay on track to achieve your full potential.
                </p>



                <h4>Core Features</h4>
                <ul>
                    <li>
                        <dl>
                            <dt><strong>Personalized Training Modules :</strong></dt>
                            <dd>
                                Focus on key skills like dribbling, shooting, passing, and speed with tailored drills.
                            </dd>
                        </dl>
                    </li>
                    <li>
                        <dl>
                            <dt><strong>AI-Driven Real-Time Feedback :</strong></dt>
                            <dd>
                                Get instant performance analysis and actionable insights to refine your techniques.
                            </dd>
                        </dl>
                    </li>
                    <li>
                        <dl>
                            <dt><strong>Quest-Based Progression :</strong></dt>
                            <dd>
                                Complete daily and weekly challenges with dynamic difficulty adjustments to keep training fresh and motivating.
                            </dd>
                        </dl>
                    </li>
                    <li>
                        <dl>
                            <dt><strong>Optional VR/AR Enhancements :</strong></dt>
                            <dd>
                                Immerse yourself in realistic on-field scenarios for hands-on practice.
                            </dd>
                        </dl>
                    </li>
                    <li>
                        <dl>
                            <dt><strong>Expert Video Tutorials :</strong></dt>
                            <dd>
                                Learn from professional players and unlock tutorials as you progress.
                            </dd>
                        </dl>
                    </li>
                    <li>
                        <dl>
                            <dt><strong>Live Challenges & Leaderboards :</strong></dt>
                            <dd>
                                Compete with friends, track your rankings, and stay motivated.
                            </dd>
                        </dl>
                    </li>
                    <li>
                        <dl>
                            <dt><strong>Visual Progress Reports :</strong></dt>
                            <dd>
                                Monitor your growth with weekly and monthly performance summaries.
                            </dd>
                        </dl>
                    </li>
                </ul>



                <h4>How it Works</h4>
                <ol>
                    <li><strong>Onboard Seasmlessly -</strong> Creat your account, set up your profile, and customize your avatar.</li>
                    <li><strong>Choose Your Quests -</strong> Select training modules tailored to your skill level and goals.</li>
                    <li><strong>Train & Improve -</strong> Receive real-time feedback, watch expert tutorials, and track your progress.</li>
                    <li><strong>Compete and Grow -</strong> Join live challenges and celebrate your achievments.</li>
                </ol>



                <h4>Built for Players and Coaches</h4>
                <h5>For Players</h5><p>Enjoy a structured, gamified training experience that adapts to your schedule and skill level.</p>
                <h5>For Coaches</h5><p>Monitor your players’ progress, review training stats, and provide targeted guidance.</p>


                <h4>The Future of Soccer Training</h4>
                <p>
                    Backed by research and emerging trends in sports technology, Footsies leverages AI and interactive learning to create a training environment that is as effective as it is engaging.
                    Whether you’re training at home or on the go, Footsies ensures you never miss a chance to improve.
                </p>

                <h4>Join the Revolution</h4>
                <p>Ready to take your soccer skills to the next level? Explore Footsies today and experience the future of personalized, AI-driven coaching.</p>
            </div>

            <footer><strong>Stay Consistent, Stay Motivated, and Watch Your Game Transform</strong></footer>
        </div>
    );
};

export default SignupPage;