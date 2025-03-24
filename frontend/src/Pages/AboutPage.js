import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRobot, 
    faChartLine, 
    faGamepad, 
    faVrCardboard, 
    faVideo, 
    faTrophy, 
    faChartBar,
    faUserGraduate,
    faUsers
} from '@fortawesome/free-solid-svg-icons';

const AboutPage = () => {
    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-12">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h2 className="card-title text-center mb-4">Why Footsies?</h2>
                            <p className="lead text-center mb-5">
                                Aspiring soccer players often face challenges like limited access to consistent coaching, 
                                high costs, and rigid schedules. Footsies solves these problems by providing an accessible, 
                                engaging, and adaptive training platform that grows with you.
                            </p>

                            <h3 className="mb-4">Core Features</h3>
                            <div className="row g-4">
                                {[
                                    {
                                        icon: faRobot,
                                        title: "Personalized Training Modules",
                                        description: "Focus on key skills like dribbling, shooting, passing, and speed with tailored drills."
                                    },
                                    {
                                        icon: faChartLine,
                                        title: "AI-Driven Real-Time Feedback",
                                        description: "Get instant performance analysis and actionable insights to refine your techniques."
                                    },
                                    {
                                        icon: faGamepad,
                                        title: "Quest-Based Progression",
                                        description: "Complete daily and weekly challenges with dynamic difficulty adjustments."
                                    },
                                    {
                                        icon: faVrCardboard,
                                        title: "Optional VR/AR Enhancements",
                                        description: "Immerse yourself in realistic on-field scenarios for hands-on practice."
                                    },
                                    {
                                        icon: faVideo,
                                        title: "Expert Video Tutorials",
                                        description: "Learn from professional players and unlock tutorials as you progress."
                                    },
                                    {
                                        icon: faTrophy,
                                        title: "Live Challenges & Leaderboards",
                                        description: "Compete with friends, track your rankings, and stay motivated."
                                    }
                                ].map((feature, index) => (
                                    <div key={index} className="col-md-6 col-lg-4">
                                        <div className="card h-100 border-0 shadow-sm">
                                            <div className="card-body">
                                                <div className="text-center mb-3">
                                                    <FontAwesomeIcon 
                                                        icon={feature.icon} 
                                                        className="fa-2x text-primary"
                                                    />
                                                </div>
                                                <h5 className="card-title text-center mb-3">{feature.title}</h5>
                                                <p className="card-text text-muted">{feature.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h3 className="mt-5 mb-4">How it Works</h3>
                            <div className="row g-4 mb-5">
                                {[
                                    {
                                        step: 1,
                                        title: "Onboard Seamlessly",
                                        description: "Create your account, set up your profile, and customize your avatar."
                                    },
                                    {
                                        step: 2,
                                        title: "Choose Your Quests",
                                        description: "Select training modules tailored to your skill level and goals."
                                    },
                                    {
                                        step: 3,
                                        title: "Train & Improve",
                                        description: "Receive real-time feedback, watch expert tutorials, and track your progress."
                                    },
                                    {
                                        step: 4,
                                        title: "Compete and Grow",
                                        description: "Join live challenges and celebrate your achievements."
                                    }
                                ].map((step, index) => (
                                    <div key={index} className="col-md-6 col-lg-3">
                                        <div className="card h-100 border-0 shadow-sm">
                                            <div className="card-body text-center">
                                                <div className="display-4 text-primary mb-3">{step.step}</div>
                                                <h5 className="card-title">{step.title}</h5>
                                                <p className="card-text text-muted">{step.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h3 className="mb-4">Built for Players and Coaches</h3>
                            <div className="row g-4 mb-5">
                                <div className="col-md-6">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body text-center">
                                            <FontAwesomeIcon icon={faUserGraduate} className="fa-2x text-primary mb-3" />
                                            <h4>For Players</h4>
                                            <p className="text-muted">
                                                Enjoy a structured, gamified training experience that adapts to your 
                                                schedule and skill level.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card h-100 border-0 shadow-sm">
                                        <div className="card-body text-center">
                                            <FontAwesomeIcon icon={faUsers} className="fa-2x text-primary mb-3" />
                                            <h4>For Coaches</h4>
                                            <p className="text-muted">
                                                Monitor your players' progress, review training stats, and provide 
                                                targeted guidance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-5">
                                <h3 className="mb-4">The Future of Soccer Training</h3>
                                <p className="lead mb-5">
                                    Backed by research and emerging trends in sports technology, Footsies leverages 
                                    AI and interactive learning to create a training environment that is as effective 
                                    as it is engaging.
                                </p>
                                <div className="mb-4">
                                    <h4>Stay Consistent, Stay Motivated, and Watch Your Game Transform</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
