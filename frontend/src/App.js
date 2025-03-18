import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './Config/firebase';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/DashboardPage';
import SignupPage from './Pages/SignupPage';
import StatPage from './Pages/StatPage';
import TrainingPage from './Pages/TrainingPage';
import SkillTrainingPage from './Pages/SkillsTrainingPage';

function App() {
  const [user, setUser] = useState(null);

  // useEffect(() => {
  //   //Listen for user authentication state changes (login or logout)
  //   const unsubscribe = auth.onAuthStateChanged(setUser);
  //   return () => unsubscribe();
  // }, []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      console.log("Auth state changed:", user); // Debug log
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log("Current user state:", user); // Debug log

  return (
    <Router>
      <div className="app-container">
        <Routes>
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
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stat/:skill" element={<SkillTrainingPage />} />
          <Route path="/training" element={<TrainingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
