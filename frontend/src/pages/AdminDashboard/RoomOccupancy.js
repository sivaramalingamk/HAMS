import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const RoomOccupancy = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Male'); // 'Male' or 'Female'

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get('http://localhost:5000/api/rooms/occupancy', config);
        
        if (response.data.success) {
          setRooms(response.data.data);
        } else {
          setError('Failed to fetch occupancy data');
        }
      } catch (err) {
        console.error('Error fetching occupancy:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchOccupancy();
  }, []);

  const getFloorName = (roomId) => {
    const floorNum = Math.floor(roomId / 100);
    if (floorNum === 1) return 'Ground Floor';
    if (floorNum === 2) return '1st Floor';
    if (floorNum === 3) return '2nd Floor';
    if (floorNum === 4) return '3rd Floor';
    return `${floorNum - 1}th Floor`;
  };

  const renderRooms = () => {
    // Filter rooms by category
    const filteredRooms = rooms.filter(room => room.category === activeTab);
    
    if (filteredRooms.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No rooms available in this category.
        </div>
      );
    }

    // Group by floor
    const floors = filteredRooms.reduce((acc, room) => {
      const floorName = getFloorName(room.id);
      if (!acc[floorName]) acc[floorName] = [];
      acc[floorName].push(room);
      return acc;
    }, {});

    return Object.entries(floors).map(([floor, floorRooms]) => (
      <div key={floor} style={{ marginBottom: '40px' }}>
        <h4 style={{ color: '#64748b', borderBottom: '2px dashed #e2e8f0', paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {floor}
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
          {floorRooms.map(room => (
            <div key={room.id} style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '15px',
              width: '180px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b', marginBottom: '10px', textAlign: 'center' }}>
                Room {room.id}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                {room.beds.map(bed => {
                  let bgColor = '#f0fdf4'; // Light Green background
                  let icon = <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#22c55e" /></svg>; // Green Circle
                  let title = 'Available';
                  
                  if (bed.status === 'booked') {
                    if (bed.gender === 'Male') {
                      bgColor = '#bfdbfe'; // Light Blue
                      icon = <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#3b82f6" /></svg>;
                      title = 'Occupied by Male';
                    } else if (bed.gender === 'Female') {
                      bgColor = '#fbcfe8'; // Light Pink
                      icon = <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#ec4899" /></svg>;
                      title = 'Occupied by Female';
                    } else {
                      bgColor = '#cbd5e1'; // Gray if unknown gender
                      icon = <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#64748b" /></svg>;
                      title = 'Occupied';
                    }
                  }

                  return (
                    <div 
                      key={bed.bedId} 
                      title={title}
                      style={{
                        background: bgColor,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'help'
                      }}
                    >
                      {icon} {bed.bedId}
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                {room.beds.filter(b => b.status === 'available').length} Available
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div>
      <header className="main-header">
        <h2>Room Occupancy Details</h2>
        <div className="user-profile">Admin User</div>
      </header>

      <section className="table-section" style={{ marginTop: '30px', padding: '30px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('Male')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'Male' ? '#2563eb' : 'transparent',
              color: activeTab === 'Male' ? 'white' : '#64748b',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            Male Hostel
          </button>
          <button 
            onClick={() => setActiveTab('Female')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'Female' ? '#db2777' : 'transparent',
              color: activeTab === 'Female' ? 'white' : '#64748b',
              fontWeight: 'bold',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            Female Hostel
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading occupancy data...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</div>
        ) : (
          renderRooms()
        )}
      </section>
    </div>
  );
};

export default RoomOccupancy;
