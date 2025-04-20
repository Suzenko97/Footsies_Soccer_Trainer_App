import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './Config/firebase';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/DashboardPage';
import SignupPage from './Pages/SignupPage';
import StatPage from './Pages/StatPage';
import SkillsTrainingPage from './Pages/SkillsTrainingPage';
import AboutPage from './Pages/AboutPage';
import ProfilePage from './Pages/ProfilePage';
import VideoTutorialsPage from './Pages/VideoTutorialsPage';
import Navigation from './Components/Navigation';
import { initializeSession, saveCurrentSession } from './Services/statService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      // If a user just logged in, initialize a new session
      if (currentUser && !user) {
        console.log("User logged in, initializing session");
        initializeSession();
      } 
      // If a user is logging out, save their current session
      else if (!currentUser && user) {
        console.log("User logging out, saving session");
        try {
          const result = await saveCurrentSession(user.uid);
          console.log("Session saved on logout:", result);
        } catch (err) {
          console.error("Error saving session on logout:", err);
        }
      }
      
      setUser(currentUser);
      setLoading(false);
    });
    
    // Initialize session on app start if user is already logged in
    if (auth.currentUser) {
      console.log("User already logged in on app start, initializing session");
      initializeSession();
    }
    
    // Handle app close/refresh
    window.addEventListener('beforeunload', async (event) => {
      if (auth.currentUser) {
        console.log("App closing, saving session");
        try {
          await saveCurrentSession(auth.currentUser.uid);
        } catch (err) {
          console.error("Error saving session on app close:", err);
        }
      }
    });
    
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', () => {});
    };
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container min-vh-100">
        {user && <Navigation />}
        <div className="content-wrapper">
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
            />
            <Route 
              path="/signup" 
              element={user ? <Navigate to="/dashboard" /> : <SignupPage />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <DashboardPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/skills" 
              element={user ? <SkillsTrainingPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/stats" 
              element={user ? <StatPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <ProfilePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/tutorials" 
              element={user ? <VideoTutorialsPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/about" 
              element={<AboutPage />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
