import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './Config/firebase';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/DashboardPage';
import SignupPage from './Pages/SignupPage';
import StatPage from './Pages/StatPage';
import TrainingPage from './Pages/TrainingPage';
import SkillTrainingPage from './Pages/SkillsTrainingPage';
import AboutPage from './Pages/AboutPage';
import Navigation from './Components/Navigation';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
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
              path="/training" 
              element={user ? <TrainingPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/skills" 
              element={user ? <SkillTrainingPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/stats" 
              element={user ? <StatPage /> : <Navigate to="/login" />} 
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
