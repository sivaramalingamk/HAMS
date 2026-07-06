import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login/Login';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Invalid user session format");
      }
    }
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    // Show a loading state or nothing while restoring session
    return <div className="loading-screen">Loading session...</div>;
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>

          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Login route */}
          <Route
            path="/login"
            element={<Login setUser={setUser} />}
          />

          {/* Student route */}
          <Route
            path="/student/*"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === 'student' ? (
                <StudentDashboard />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />

          {/* Admin route */}
          <Route
            path="/admin/*"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/student" replace />
              )
            }
          />

        </Routes>
        <footer className="global-footer">
          <p>&copy; Hostel Accommodation Management System. University of Vavuniya.</p>
          <p>All Rights Reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;