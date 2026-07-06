import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Overview from './Overview';
import ManageApplications from './ManageApplications';
import StudentRecords from './StudentRecords';
import RoomOccupancy from './RoomOccupancy';
import './AdminDashboard.css';

const AdminDashboard = () => {

  return (
    <div className="admin-layout-topnav">
      {/* Top Navigation Bar */}
      <nav className="admin-top-nav">
        <div className="nav-brand">
          <span className="logo-icon">🏢</span> 
          <h2>HAMS Admin</h2>
        </div>
        <ul className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <li><NavLink to="/admin" end>Overview</NavLink></li>
          <li><NavLink to="/admin/applications">Manage Applications</NavLink></li>
          <li><NavLink to="/admin/students">Student Records</NavLink></li>
          <li><NavLink to="/admin/room-occupancy">Room Occupancy</NavLink></li>
          <li>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              style={{
                background: 'transparent',
                border: '1px solid #fff',
                color: '#fff',
                padding: '6px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                marginTop: '15px'
              }}
              onMouseOver={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#2b6cb0'; }}
              onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area Routing */}
      <main className="admin-main-content">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="applications" element={<ManageApplications />} />
          <Route path="students" element={<StudentRecords />} />
          <Route path="room-occupancy" element={<RoomOccupancy />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
