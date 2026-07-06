import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ApplicationForm from './ApplicationForm';
import API_BASE_URL from '../../config';
import './StudentDashboard.css';

const StudentHome = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [userName, setUserName] = useState('Students');

  useEffect(() => {
    fetchNotifications();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.firstName || 'Students');
    }
  }, []);

  const fetchNotifications = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setLoadingNotifs(false);
      return;
    }
    const user = JSON.parse(userStr);
    
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${user.email}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoadingNotifs(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: 1 } : n));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  return (
    <div className="home-dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1 className="main-welcome">
            <span className="highlight-text">✨ Welcome back, {userName}!</span>
          </h1>
          <p className="welcome-subtitle">
            Your personal Hostel Accommodation Management portal
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <section className="dashboard-section actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-cards">
            <div className="action-card highlight" onClick={() => navigate('/student/apply')}>
              <div className="action-icon icon-maroon">📝</div>
              <div className="action-text">
                <h3>Apply for Hostel</h3>
                <p>Submit your application for the upcoming academic year.</p>
              </div>
            </div>
            
            <div className="action-card" onClick={() => navigate('/student/status')}>
              <div className="action-icon icon-gold">📊</div>
              <div className="action-text">
                <h3>Check Status</h3>
                <p>View the current status of your submitted applications.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Info Panels */}
        <div className="info-panels-grid">
          <section className="dashboard-section info-section">
            <div className="info-header">
              <span className="info-icon">📢</span>
              <h2>Announcements</h2>
            </div>
            <div className="info-content notifications">
              {loadingNotifs ? (
                <p style={{ padding: '10px', color: '#718096' }}>Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p style={{ padding: '10px', color: '#718096' }}>No new notifications.</p>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    style={{ cursor: !notif.isRead ? 'pointer' : 'default' }}
                  >
                    {!notif.isRead && <div className="notif-pulse"></div>}
                    {notif.isRead && <div className="notif-pulse read"></div>}
                    <div className="notif-details">
                      <h4>{notif.title}</h4>
                      <p>{notif.message}</p>
                      <small>{new Date(notif.created_at).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-section info-section rules-mini-card">
            <div className="info-header">
              <span className="info-icon">📖</span>
              <h2>Key Guidelines</h2>
            </div>
            <div className="info-content">
              <ul className="modern-list">
                <li><span className="list-emoji">⏰</span> Return to boys hostel before 9:00 PM and girls hostel 7.00 PM</li>
                <li><span className="list-emoji">👥</span> Visitors not allowed .</li>
                <li><span className="list-emoji">🗑️</span> Dispose waste only in designated bins.</li>
                <li><span className="list-emoji">🧹</span> Maintain room cleanliness.</li>
                <li><span className="list-emoji">🚭</span> Smoking, alcohol, and drugs are strictly prohibited.</li>
                <li><span className="list-emoji">🪑</span> Do not damage or move hostel property without permission.</li>
                <li><span className="list-emoji">🔧</span> Report any maintenance issues immediately.</li>
                <li><span className="list-emoji">💡</span> Turn off lights, fans, and electrical items when leaving the room.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ApplicationStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        const token = localStorage.getItem('token');
        console.log('🔍 Fetching status for:', user.email);
        const response = await fetch(`${API_BASE_URL}/applications/student/${user.email}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          setStatus(data.data.status);
          setApplication(data.data);
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content">
        <h2>Current Status</h2>
        <div className="loading-spinner">Checking your application status...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="dashboard-content">
        <h2>Current Status</h2>
        <div className="status-card info">
          <h3>No Application Found</h3>
          <p>You haven't submitted a hostel application yet. Please use the "Apply" tab to get started.</p>
        </div>
      </div>
    );
  }

  // Parse formData safely
  let parsedForm = {};
  try {
    parsedForm = typeof application.formData === 'string' ? JSON.parse(application.formData) : (application.formData || {});
  } catch (e) {
    console.error("Error parsing formData");
  }

  const selectedRoom = (application.adminData && application.adminData.roomNo) 
                       || (parsedForm.roomSelection && parsedForm.roomSelection.roomId) 
                       || 'Not Selected';

  return (
    <div className="dashboard-content status-page">
      <div className="status-header">
        <span className="status-icon">🏆</span>
        <h2>Track Your Application</h2>
      </div>
      
      <div className={`status-card-premium ${status.toLowerCase()}`}>
        <div className="status-indicator">
          <div className="pulse-dot"></div>
          <span className="status-label">{status}</span>
        </div>
        
        <div className="status-body">
          <h3>Your Current Status: <span className="status-highlight">{status}</span></h3>
          
          <div className="allocation-info" style={{ marginTop: '20px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #5b1434' }}>
            <div className="info-item">
               <label style={{ fontWeight: 'bold', color: '#4a5568' }}>
                 {status === 'Approved' ? 'Allocated Room:' : 'Requested Room:'}
               </label>
               <span style={{ marginLeft: '10px', fontSize: '1.1em', color: '#2d3748' }}>
                 {selectedRoom !== 'Not Selected' ? `Room ${selectedRoom}` : 'Not Selected'}
                 {status === 'Pending' && selectedRoom !== 'Not Selected' && (
                   <span style={{ color: '#c53030', fontSize: '0.85em', marginLeft: '10px', fontStyle: 'italic' }}>(Pending Admin Approval)</span>
                 )}
               </span>
            </div>
          </div>

          {status === 'Pending' && (
            <p className="status-info">
               We have received your application! Our administrative team is currently reviewing your details. 
               Please check back within 3-5 working days.
            </p>
          )}
          
          {status === 'Approved' && (
            <div className="success-details">
              <p className="success-msg">🎉 Congratulations! Your request for hostel accommodation has been approved.</p>
              <div className="allocation-info">
                  <div className="info-item">
                     <label>Allocated Room Type</label>
                     <span>{application.roomType || 'Standard University Housing'}</span>
                  </div>
                  {application.adminData && application.adminData.hostel && (
                    <div className="info-item">
                       <label>Allocated Hostel/Place</label>
                       <span>{application.adminData.hostel}</span>
                    </div>
                  )}
                  <div className="info-item">
                     <label>Requested No.</label>
                     <span>{application.id}</span>
                  </div>
              </div>
              <p className="next-steps">Action Required: Please visit the Provost's Office during office hours to finalize your check-in.</p>
            </div>
          )}
          
          {status === 'Rejected' && (
            <div className="error-details">
               <p>We regret to inform you that your application for the current academic session was not approved.</p>
               <p className="error-reason">Note: You may re-apply if there was a mistake in your submission.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="logo-icon">🏢</span> HAMS Student
        </div>
        <ul className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <li><Link to="/student/home">Home</Link></li>
          <li><Link to="/student/apply">Apply for Hostel</Link></li>
          <li><Link to="/student/status">Current Status</Link></li>
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

      <main className="dashboard-main">
        <Routes>
          <Route index element={<StudentHome />} />
          <Route path="home" element={<StudentHome />} />
          <Route path="apply" element={<ApplicationForm />} />
          <Route path="status" element={<ApplicationStatus />} />
        </Routes>
      </main>
    </div>
  );
};

export default StudentDashboard;
