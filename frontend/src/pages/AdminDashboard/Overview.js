import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import axios from 'axios';

const Overview = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    pendingApplications: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get('http://localhost:5000/api/dashboard/stats', config);
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <header className="main-header">
        <h2>Dashboard Overview</h2>
        <div className="user-profile">Admin User</div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue">👥</div>
          <div className="stat-details">
            <h4>Total Students</h4>
            <p>{stats.totalStudents}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green">🛏️</div>
          <div className="stat-details">
            <h4>Available Beds</h4>
            <p>{stats.availableBeds}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-gray">🛌</div>
          <div className="stat-details">
            <h4>Occupied Beds</h4>
            <p>{stats.occupiedBeds}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange">📄</div>
          <div className="stat-details">
            <h4>Pending Applications</h4>
            <p>{stats.pendingApplications}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
