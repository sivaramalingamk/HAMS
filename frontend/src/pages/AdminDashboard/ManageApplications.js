import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import './AdminDashboard.css';

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appSignature, setAppSignature] = useState(null);
  const [showOriginalSig, setShowOriginalSig] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [adminData, setAdminData] = useState({
    year: '',
    faculty: '',
    hostel: '',
    distance: '',
    points: '',
    roomNo: '',
    prevYear: '',
    prevDuration: '',
    remarks: '',
    subWardenRec: 'Recommended'
  });

  useEffect(() => {
    fetchApplications();
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/rooms/available`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableRooms(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const parsedApps = data.data.map(app => {
          let parsedData = {};
          if (app.formData) {
            try {
              parsedData = typeof app.formData === 'string' ? JSON.parse(app.formData) : app.formData;
            } catch (e) { }
          }
          return { ...app, formData: parsedData };
        });
        setApplications(parsedApps);
      }
    } catch (err) {
      console.error('Failed to fetch applications');
    }
  };

  const updateStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, adminData: adminData })
      });
      if (response.ok) {
        setApplications(applications.map(app =>
          app.id === id ? { ...app, status: newStatus, adminData: adminData } : app
        ));
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const openModal = async (app) => {
    setSelectedApp(app);
    setShowOriginalSig(false);
    setAppSignature(null);
    setAdminData(app.adminData || {
      year: '',
      faculty: '',
      hostel: '',
      distance: app.formData?.distance || '',
      points: '',
      roomNo: '',
      prevYear: '',
      prevDuration: '',
      remarks: '',
      subWardenRec: 'Recommended'
    });

    if (app.formData?.signatureId) {
      try {
        const response = await fetch(`${API_BASE_URL}/upload/signature/${app.formData.signatureId}`);
        const data = await response.json();
        if (data.success) {
          setAppSignature(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch signature data');
      }
    }
  };

  const closeModal = () => {
    setSelectedApp(null);
  };

  return (
    <div>
      <header className="main-header">
        <h2>Manage Applications</h2>
        <div className="user-profile">Admin User</div>
      </header>

      {/* Table Section */}
      <section className="table-section" style={{ marginTop: '30px' }}>
        <div className="section-header">
          <h3>Recent Applications</h3>
        </div>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Reg. Number</th>
                <th>Date Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} onClick={() => openModal(app)} className="table-row-interactive">
                  <td>
                    <div className="student-name-cell">
                      <div className="avatar-placeholder">{app.studentName ? app.studentName.charAt(0) : '?'}</div>
                      <span>{app.studentName}</span>
                    </div>
                  </td>
                  <td><span className="mono-text">{app.admissionNo}</span></td>
                  <td>{app.date ? new Date(app.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</td>
                  <td>
                    <span className={`status-badge ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail Modal overlay */}
      {selectedApp && (
        <div className="modal-overlay" onClick={closeModal}>
          <style>
            {`
              @media print {
                /* Hide navs, headers, tables, and specific buttons completely so they take 0 space */
                .admin-top-nav, .main-header, .admin-sidebar, .admin-header, .stats-section, .table-section, .section-header, .signature-display button {
                  display: none !important;
                }
                /* Reset containers */
                .admin-layout-topnav, .admin-main-content, .admin-main, .admin-content, .admin-dashboard-container {
                  padding: 0 !important; margin: 0 !important; width: 100% !important; height: auto !important;
                }
                /* Convert modal to normal document flow */
                .modal-overlay {
                  position: static !important; background: transparent !important; padding: 0 !important; height: auto !important;
                }
                .modal-content {
                  position: static !important;
                  box-shadow: none !important; border: none !important; width: 100% !important; 
                  max-height: none !important; overflow: visible !important; margin: 0 !important; padding: 0 !important;
                }
                /* Hide buttons */
                .modal-header .close-btn, .modal-footer { display: none !important; }
                /* Scale slightly and enforce page break for Office Use */
                .modal-body { zoom: 0.95; }
                .modal-admin-section { page-break-before: always; break-before: page; margin-top: 20px !important; }
              }
            `}
          </style>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Application Details - {selectedApp.id}</h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {/* <div className="modal-col">
                  <h4>Student Information</h4>
                  <p><strong>Name:</strong> {selectedApp.studentName}</p>
                  <p><strong>Reg No:</strong> {selectedApp.admissionNo}</p>
                  <p><strong>Applied On:</strong> {selectedApp.date ? new Date(selectedApp.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</p>
                  <p><strong>Requested Room:</strong> {selectedApp.formData?.roomSelection?.roomId ? `Room ${selectedApp.formData.roomSelection.roomId}` : 'Not Specified'}</p>
                  <p><strong>Status:</strong> <span className={`status-badge ${selectedApp.status.toLowerCase()}`}>{selectedApp.status}</span></p>
                </div> */}
                <div className="modal-col flex-center">
                  <h4>Uploaded Photo</h4>
                  <img
                    src={selectedApp.formData?.photo || selectedApp.photo || 'https://via.placeholder.com/150'}
                    alt="Student"
                    className="modal-photo"
                  />
                </div>
                <div className="modal-col flex-center">
                  <h4>Digital Signature</h4>
                  <div className="signature-display">
                    {appSignature ? (
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <img
                          src={`http://localhost:5000${showOriginalSig ? appSignature.original_path : appSignature.processed_path}`}
                          alt="Digital Signature"
                          style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                        <div style={{ marginTop: '15px' }}>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            onClick={() => setShowOriginalSig(!showOriginalSig)}
                          >
                            {showOriginalSig ? 'Show Cleaned Signature' : 'Show Original Upload'}
                          </button>
                        </div>
                      </div>
                    ) : (selectedApp.formData?.signature || selectedApp.signature) ? (
                      <img
                        src={selectedApp.formData?.signature || selectedApp.signature}
                        alt="Digital Signature"
                        style={{ maxHeight: '100px', maxWidth: '100%' }}
                      />
                    ) : (
                      <span className="placeholder-sig">No Signature Recorded</span>
                    )}
                  </div>
                </div>
              </div>
              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
              <div className="modal-student-full-data">
                <h4 style={{ color: '#2d3748', marginBottom: '15px' }}>Full Application Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <p><strong>Academic Year:</strong> {selectedApp.formData?.academicYear}</p>
                  <p><strong>Enrolment No:</strong> {selectedApp.formData?.enrolmentNo}</p>
                  <p><strong>Full Name:</strong> {selectedApp.formData?.title} {selectedApp.formData?.nameWithInitial}</p>
                  <p><strong>Name by Initials:</strong> {selectedApp.formData?.nameDenotedByInitials}</p>
                  <p><strong>Sex:</strong> {selectedApp.formData?.sex}</p>
                  <p><strong>Race:</strong> {selectedApp.formData?.race}</p>
                  <p><strong>Date of Birth:</strong> {selectedApp.formData?.dob}</p>
                  <p><strong>NIC:</strong> {selectedApp.formData?.nic}</p>
                  <p><strong>Mobile:</strong> {selectedApp.formData?.handPhone}</p>
                  <p><strong>Residential Phone:</strong> {selectedApp.formData?.residentialPhone}</p>
                  <p><strong>Email:</strong> {selectedApp.formData?.email}</p>
                  <p><strong>Private Email:</strong> {selectedApp.formData?.privateEmail}</p>
                  <p style={{ gridColumn: '1 / -1' }}><strong>Permanent Address:</strong> {selectedApp.formData?.permanentAddress}</p>
                  <p><strong>Province:</strong> {selectedApp.formData?.province}</p>
                  <p><strong>District:</strong> {selectedApp.formData?.district}</p>
                  <p><strong>Divisional Secretariat:</strong> {selectedApp.formData?.divisionalSecretariat}</p>
                  <p><strong>Distance to Uni:</strong> {selectedApp.formData?.distance} KM</p>
                  <p><strong>Differently Abled:</strong> {selectedApp.formData?.differentlyAbled}</p>
                  <p><strong>Requested Room:</strong> {selectedApp.formData?.roomSelection?.roomId}</p>
                  {console.log(selectedApp.formData)}
                  {selectedApp.formData?.differentlyAbled === 'Yes' && (
                    <p style={{ gridColumn: '1 / -1', color: '#e53e3e' }}><strong>Sickness Details:</strong> {selectedApp.formData?.sicknessDetails}</p>
                  )}
                  <p style={{ gridColumn: '1 / -1', marginTop: '10px', borderBottom: '1px solid #cbd5e0', paddingBottom: '5px' }}><strong>Emergency Contact</strong></p>
                  <p><strong>Name:</strong> {selectedApp.formData?.emergencyName}</p>
                  <p><strong>Relationship:</strong> {selectedApp.formData?.emergencyRelationship}</p>
                  <p><strong>Contact No:</strong> {selectedApp.formData?.emergencyContact}</p>
                </div>
              </div>
              <div className="modal-admin-section" style={{ border: '1px solid #000', padding: '20px', marginTop: '20px', backgroundColor: '#fff', color: '#000' }}>
                <h4 style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>OFFICE USE ONLY</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Year:</label>
                  <input type="text" value={adminData.year} onChange={e => setAdminData({ ...adminData, year: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />

                  <label style={{ fontWeight: 'bold' }}>Faculty:</label>
                  <input type="text" value={adminData.faculty} onChange={e => setAdminData({ ...adminData, faculty: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />

                  <label style={{ fontWeight: 'bold', gridColumn: '1 / -1' }}>Name of the Hostel/Place:</label>
                  <input type="text" value={adminData.hostel} onChange={e => setAdminData({ ...adminData, hostel: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', gridColumn: '1 / -1', marginBottom: '10px', backgroundColor: 'transparent' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                  <label style={{ fontWeight: 'bold' }}>Distance:</label>
                  <input type="text" value={adminData.distance} onChange={e => setAdminData({ ...adminData, distance: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />

                  <label style={{ fontWeight: 'bold' }}>Points:</label>
                  <input type="text" value={adminData.points} onChange={e => setAdminData({ ...adminData, points: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />

                  <label style={{ fontWeight: 'bold' }}>Room No:</label>
                  {selectedApp.status === 'Pending' ? (
                    <select
                      value={adminData.roomNo}
                      onChange={e => setAdminData({ ...adminData, roomNo: e.target.value })}
                      style={{ border: '1px solid #ccc', outline: 'none', width: '100%', backgroundColor: '#fff', padding: '2px' }}
                    >
                      <option value="">Select a room...</option>
                      {availableRooms.map(room => (
                        <option key={room.id} value={room.id}>{room.id}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={adminData.roomNo} disabled style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />
                  )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Previous details of hostel facilities</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 1fr', gap: '10px', paddingLeft: '40px', alignItems: 'center' }}>
                    <label>Year:</label>
                    <input type="text" value={adminData.prevYear} onChange={e => setAdminData({ ...adminData, prevYear: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />
                    <label>Duration:</label>
                    <input type="text" value={adminData.prevDuration} onChange={e => setAdminData({ ...adminData, prevDuration: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: 'none', borderBottom: '1px dotted #000', outline: 'none', width: '100%', backgroundColor: 'transparent' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '30px' }}>
                  <label style={{ fontWeight: 'bold', marginRight: '10px', whiteSpace: 'nowrap' }}>Remarks:</label>
                  <textarea value={adminData.remarks} onChange={e => setAdminData({ ...adminData, remarks: e.target.value })} disabled={selectedApp.status !== 'Pending'} rows="3" style={{ border: '1px solid #ccc', outline: 'none', width: '100%', resize: 'vertical', padding: '5px', backgroundColor: 'transparent' }}></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
                  <div>
                    <select value={adminData.subWardenRec} onChange={e => setAdminData({ ...adminData, subWardenRec: e.target.value })} disabled={selectedApp.status !== 'Pending'} style={{ border: '1px solid #ccc', padding: '5px', borderRadius: '4px', outline: 'none', backgroundColor: '#fff' }}>
                      <option value="Recommended">Recommended</option>
                      <option value="Not recommended">Not recommended</option>
                    </select>
                  </div>
                  <div style={{ textAlign: 'center', width: '250px' }}>
                    <div style={{ borderBottom: '1px dotted #000', height: '30px', marginBottom: '5px' }}></div>
                    <span style={{ fontWeight: 'bold' }}>Sub-warden/Hostel</span>
                  </div>
                </div>
              </div>

              <div className="modal-deputy-registrar-section" style={{ marginTop: '30px', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontWeight: 'bold' }}>
                  The above application is
                  <select value={selectedApp.status === 'Pending' ? '' : selectedApp.status} onChange={(e) => { }} disabled style={{ marginLeft: '10px', border: 'none', fontWeight: 'bold', appearance: 'none', backgroundColor: 'transparent', outline: 'none' }}>
                    <option value="">___________________</option>
                    <option value="Approved">approved</option>
                    <option value="Rejected">not approved</option>
                  </select>
                  .
                </div>
                <div style={{ textAlign: 'center', width: '250px' }}>
                  <div style={{ borderBottom: '1px dotted #000', height: '30px', marginBottom: '5px' }}></div>
                  <span style={{ fontWeight: 'bold', display: 'block' }}>Deputy Registrar</span>
                  <span>Student & Welfare Division</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedApp.status === 'Pending' && (
                <>
                  {(!adminData.subWardenRec || adminData.subWardenRec === 'Recommended') && (
                    <button onClick={(e) => { updateStatus(selectedApp.id, 'Approved', e); closeModal(); }} className="btn-action btn-approve">Approve Application</button>
                  )}
                  {adminData.subWardenRec === 'Not recommended' && (
                    <button onClick={(e) => { updateStatus(selectedApp.id, 'Rejected', e); closeModal(); }} className="btn-action btn-reject">Reject Application</button>
                  )}
                </>
              )}
              {(selectedApp.status === 'Approved' || selectedApp.status === 'Rejected') && (
                <button
                  className="btn-action"
                  style={{ backgroundColor: '#2b6cb0', color: 'white', marginRight: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => window.print()}
                >
                  <span style={{ fontSize: '1.2rem' }}>🖨️</span> Print Application
                </button>
              )}
              <button className="btn-secondary" onClick={closeModal}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApplications;
