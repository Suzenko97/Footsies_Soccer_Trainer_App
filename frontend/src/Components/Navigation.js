import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../Config/firebase';
import { saveCurrentSession } from '../Services/statService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBars, 
    faTimes, 
    faHome, 
    faDumbbell, 
    faGraduationCap, 
    faChartLine,
    faSignOutAlt,
    faInfoCircle,
    faUserCircle,
    faFutbol,
    faVideo
} from '@fortawesome/free-solid-svg-icons';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        try {
            if (auth.currentUser) {
                console.log("Saving session before logout");
                await saveCurrentSession(auth.currentUser.uid);
            }
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const menuItems = [
        { path: '/dashboard', icon: faHome, label: 'Dashboard' },
        { path: '/skills', icon: faGraduationCap, label: 'Skills' },
        { path: '/tutorials', icon: faVideo, label: 'Video Tutorials' },
        { path: '/stats', icon: faChartLine, label: 'Statistics' },
        { path: '/profile', icon: faUserCircle, label: 'Profile' },
        { path: '/about', icon: faInfoCircle, label: 'About' },
    ];

    if (!mounted) {
        return null;
    }

    return (
        <div className="navigation-wrapper">
            <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top">
                <div className="container-fluid px-3 d-flex justify-content-between">
                    <span 
                        className="navbar-brand" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/dashboard')}
                    >
                        <FontAwesomeIcon 
                            icon={faFutbol} 
                            className="me-2" 
                            style={{ 
                                fontSize: '1.5rem', 
                                color: '#28a745'
                            }} 
                        />
                        Footsies
                    </span>
                    <button 
                        className="navbar-toggler border-0 p-0" 
                        type="button" 
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ 
                            fontSize: '1.5rem',
                            display: 'block',
                            position: 'relative',
                            zIndex: 1050
                        }}
                    >
                        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
                    </button>
                </div>
            </nav>

            {/* Sidebar */}
            <div className="sidebar" style={{
                position: 'fixed',
                top: '56px',
                left: isOpen ? '0' : '-250px',
                width: '250px',
                height: 'calc(100vh - 56px)',
                backgroundColor: '#fff',
                boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                transition: 'left 0.3s ease',
                zIndex: 1029,
                overflowY: 'auto'
            }}>
                <div className="d-flex flex-column h-100">
                    <div className="flex-grow-1">
                        {menuItems.map((item) => (
                            <div 
                                key={item.path}
                                className={`sidebar-item d-flex align-items-center p-3 ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsOpen(false);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    color: location.pathname === item.path ? 'var(--teal-primary)' : 'inherit',
                                    backgroundColor: location.pathname === item.path ? '#f8f9fa' : 'transparent'
                                }}
                            >
                                <FontAwesomeIcon icon={item.icon} className="me-3" />
                                {item.label}
                            </div>
                        ))}
                    </div>
                    <div 
                        className="sidebar-item d-flex align-items-center p-3 text-danger"
                        onClick={handleLogout}
                        style={{ cursor: 'pointer' }}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} className="me-3" />
                        Logout
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        top: '56px',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1028
                    }}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default Navigation;
