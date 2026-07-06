import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import './ApplicationForm.css';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    academicYear: '2024 / 2025',
    enrolmentNo: '',
    title: 'Mr',
    nameWithInitial: '',
    nameDenotedByInitials: '',
    sex: '',
    race: '',
    dob: '',
    nic: '',
    handPhone: '',
    email: '',
    privateEmail: '',
    permanentAddress: '',
    province: '',
    district: '',
    divisionalSecretariat: '',
    distance: '',
    residentialPhone: '',
    differentlyAbled: 'No',
    sicknessDetails: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyContact: '',
    declarationAccepted: false,
    signatureId: null,
    photo: null,
    travelTime: '',
    userLocation: null
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [signaturePreview, setSignaturePreview] = useState(null);
  const [signatureError, setSignatureError] = useState('');
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const [existingAppId, setExistingAppId] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const districtsByProvince = {
    "Central Province": ["Kandy", "Matale", "Nuwara Eliya"],
    "Eastern Province": ["Ampara", "Batticaloa", "Trincomalee"],
    "North Central Province": ["Anuradhapura", "Polonnaruwa"],
    "Northern Province": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
    "North Western Province": ["Kurunegala", "Puttalam"],
    "Sabaragamuwa Province": ["Kegalle", "Ratnapura"],
    "Southern Province": ["Galle", "Hambantota", "Matara"],
    "Uva Province": ["Badulla", "Moneragala"],
    "Western Province": ["Colombo", "Gampaha", "Kalutara"]
  };

  // Pre-fill student data from login session
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      let autoEnrolmentNo = '';
      if (user.email) {
        let extractedPrefix = user.email.split('@')[0];
        // Try to format it as YYYY/DEP/XX (e.g. 2021ict35 -> 2021/ICT/35)
        const match = extractedPrefix.match(/^(\d{4})([a-zA-Z]+)(\d+)$/);
        if (match) {
          autoEnrolmentNo = `${match[1]}/${match[2].toUpperCase()}/${match[3]}`;
        } else {
          autoEnrolmentNo = extractedPrefix.toUpperCase();
        }
      }
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        nameWithInitial: prev.nameWithInitial,
        enrolmentNo: autoEnrolmentNo,
        sex: user.gender || prev.sex,
        dob: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : prev.dob,
        handPhone: user.phoneNumber || prev.handPhone,
        nic: user.nic || prev.nic
      }));
    }
  }, []);

  React.useEffect(() => {
    const fetchExistingApplication = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr && token) {
        const user = JSON.parse(userStr);
        try {
          const res = await fetch(`${API_BASE_URL}/applications/student/${user.email}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.data) {
            setExistingAppId(data.data.id);
            setAppStatus(data.data.status);
            if (data.data.status === 'Rejected') {
              let parsedForm = typeof data.data.formData === 'string' ? JSON.parse(data.data.formData) : data.data.formData;
              setFormData(prev => ({ ...prev, ...parsedForm }));
              if (parsedForm.roomSelection && parsedForm.roomSelection.roomId) {
                setSelectedRoomId(parsedForm.roomSelection.roomId.toString());
              }
            }
          }
        } catch (err) {
          console.error("Failed to check existing application:", err);
        }
      }
      setLoadingExisting(false);
    };

    fetchExistingApplication();
  }, []);

  React.useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const gender = formData.sex || 'Male'; // Fallback to male
        const response = await fetch(`${API_BASE_URL}/rooms/available?gender=${gender}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setAvailableRooms(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch available rooms:", err);
      }
    };
    if (formData.sex) {
      fetchRooms();
    } else {
      // If sex is not selected yet, still fetch default or clear
      fetchRooms();
    }
  }, [formData.sex]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoDistance = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsCalculatingDistance(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const studentLat = position.coords.latitude;
        const studentLon = position.coords.longitude;

        // Coordinates for University of Vavuniya (Pampaimadu Campus)
        const uniLat = 8.7586746;
        const uniLon = 80.4106966;

        try {
          // OSRM API Request
          // Format: {longitude},{latitude};{longitude},{latitude}
          const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${studentLon},${studentLat};${uniLon},${uniLat}?overview=false`);
          const data = await response.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distance;
            const durationSeconds = data.routes[0].duration;

            // Transformations
            const distanceKm = (distanceMeters / 1000).toFixed(2);
            const durationMinutes = Math.round(durationSeconds / 60);

            setFormData(prev => ({
              ...prev,
              distance: distanceKm,
              travelTime: durationMinutes,
              userLocation: { lat: studentLat, lon: studentLon }
            }));
          } else {
            alert("Could not calculate a route to the university.");
          }
        } catch (error) {
          console.error("OSRM API Error:", error);
          alert("Failed to connect to the routing service.");
        } finally {
          setIsCalculatingDistance(false);
        }
      },
      (error) => {
        alert("Unable to retrieve your location. Please ensure Location Services are allowed in your browser.");
        setIsCalculatingDistance(false);
      }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let finalValue = value;

    // Strict validation: Phone numbers should only contain digits and max 10 characters
    if (name === 'handPhone' || name === 'residentialPhone' || name === 'emergencyContact') {
      finalValue = value.replace(/\D/g, ''); // Removes any non-digit character instantly
      if (finalValue.length > 10) finalValue = finalValue.slice(0, 10);
    }

    // Strict validation: Sri Lankan NIC formatting
    if (name === 'nic') {
      finalValue = value.toUpperCase().replace(/[^0-9VX]/g, ''); // Only numbers and V/X
      if (finalValue.includes('V') || finalValue.includes('X')) {
        if (finalValue.length > 10) finalValue = finalValue.slice(0, 10); // Old format
      } else {
        if (finalValue.length > 12) finalValue = finalValue.slice(0, 12); // New format
      }
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : finalValue,
      ...(name === 'province' && { district: '' })
    });
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSignatureError('');

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setSignatureError('Only JPG or PNG files are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('File size must be less than 2MB.');
      return;
    }

    setIsUploadingSignature(true);
    const uploadData = new FormData();
    uploadData.append('signature', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/signature`, {
        method: 'POST',
        body: uploadData
      });
      const data = await response.json();
      if (data.success) {
        setSignaturePreview(`http://localhost:5000${data.data.processed_path}`);
        setFormData(prev => ({ ...prev, signatureId: data.data.id }));
      } else {
        setSignatureError('Failed to process image. Try again.');
      }
    } catch (err) {
      setSignatureError('Network error. Failed to connect to upload service.');
    } finally {
      setIsUploadingSignature(false);
      e.target.value = null; // reset file input
    }
  };

  const clearSignature = () => {
    setSignaturePreview(null);
    setFormData(prev => ({ ...prev, signatureId: null }));
    setSignatureError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.signatureId) {
      alert("Please upload your signature before submitting.");
      return;
    }

    // Strict validation: Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address (e.g., student@stu.vau.ac.lk)!");
      return;
    }

    const finalData = { ...formData };

    if (selectedRoomId) {
      const room = availableRooms.find(r => r.id.toString() === selectedRoomId.toString());
      if (room && room.beds.length > 0) {
        finalData.roomSelection = {
          roomId: room.id,
          bedId: room.beds[0].bedId
        };
      }
    }

    try {
      const token = localStorage.getItem('token');
      const endpoint = existingAppId ? `${API_BASE_URL}/applications/student/${existingAppId}` : `${API_BASE_URL}/applications`;
      const method = existingAppId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(finalData)
      });
      const data = await response.json();
      if (data.success) {
        alert(existingAppId ? 'Application Updated Successfully!' : 'Application Submitted Successfully!');
        navigate('/student/status');
      } else {
        alert('Error processing application: ' + data.message);
      }
    } catch (err) {
      alert('Failed to connect to backend server.');
    }
  };

  if (loadingExisting) {
    return <div className="application-form-container"><p>Loading application data...</p></div>;
  }

  if (appStatus === 'Approved') {
    return (
      <div className="application-form-container">
        <div className="status-card info" style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', border: '1px solid #cbd5e0', borderRadius: '12px' }}>
          <h2>Application Approved</h2>
          <p>Your application has been <strong>Approved</strong>. You can no longer edit it.</p>
          <button onClick={() => navigate('/student/status')} className="submit-btn primary" style={{ marginTop: '20px' }}>Go to Status Page</button>
        </div>
      </div>
    );
  }

  if (appStatus === 'Pending') {
    return (
      <div className="application-form-container">
        <div className="status-card info" style={{ padding: '30px', textAlign: 'center', background: '#ebf8ff', border: '1px solid #90cdf4', borderRadius: '12px' }}>
          <h2>Application Pending</h2>
          <p>Your application is currently <strong>Pending</strong> review. You cannot edit it at this time.</p>
          <button onClick={() => navigate('/student/status')} className="submit-btn primary" style={{ marginTop: '20px' }}>Go to Status Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-form-container">
      {existingAppId && appStatus === 'Rejected' && (
        <div className="distance-note" style={{ marginBottom: '20px', fontSize: '1.1em', padding: '15px', background: '#fff5f5', borderColor: '#feb2b2', color: '#c53030' }}>
          ⚠️ Your previous application was rejected. Please review and update your details below to re-submit.
        </div>
      )}
      <div className="form-header">
        <div className="header-titles">
          <h3>University of Vavuniya</h3>
          <h2>APPLICATION FOR HOSTEL ACCOMMODATION</h2>
          <div className="academic-year">
            <label>Academic Year</label>
            <select name="academicYear" value={formData.academicYear} onChange={handleChange}>
              <option value="2023 / 2024">2023 / 2024</option>
              <option value="2024 / 2025">2024 / 2025</option>
              <option value="2025 / 2026">2025 / 2026</option>
              <option value="2026 / 2027">2026 / 2027</option>
            </select>
          </div>
        </div>
        <div className="photo-box">
          {photoPreview ? (
            <img src={photoPreview} alt="Student Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>Upload Photo</span>
          )}
          <input type="file" accept="image/*" title="Upload Photo" onChange={handlePhotoChange} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="hostel-form">
        <div className="form-group full-width">
          <label>Enrolment No:</label>
          <input type="text" name="enrolmentNo" value={formData.enrolmentNo} onChange={handleChange} required />
        </div>

        <div className="form-section">
          <div className="form-group row-group">
            <label>1. (a) Name with initial:</label>
            <select name="title" value={formData.title} onChange={handleChange}>
              <option value="Rev">Rev</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Miss">Miss</option>
            </select>
            <input type="text" name="nameWithInitial" value={formData.nameWithInitial} onChange={handleChange} style={{ flex: 1 }} required />
          </div>

          <div className="form-group full-width">
            <label>&nbsp;&nbsp;&nbsp;&nbsp;(b) Name Denoted by the initials:</label>
            <input type="text" name="nameDenotedByInitials" value={formData.nameDenotedByInitials} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label>2. (a) Sex:</label>
            <select name="sex" value={formData.sex} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group half-width">
            <label>(b) Race:</label>
            <input type="text" name="race" value={formData.race} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label>3. (a) Date of Birth:</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
          </div>
          <div className="form-group half-width">
            <label>(b) N.I.C No:</label>
            <input type="text" name="nic" value={formData.nic} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group full-width">
          <label>4. Mobile Phone No:</label>
          <input type="tel" name="handPhone" value={formData.handPhone} onChange={handleChange} required />
        </div>

        <div className="form-group full-width">
          <label>5. (a) University E-Mail Address:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group full-width">
          <label>&nbsp;&nbsp;&nbsp;&nbsp;(b) Personal E-Mail Address (Optional):</label>
          <input
            type="email"
            name="privateEmail"
            value={formData.privateEmail}
            onChange={handleChange}
            placeholder="e.g. yourname@gmail.com"
          />
        </div>

        <div className="form-group full-width">
          <label>6. (a) Permanent residential address:</label>
          <textarea name="permanentAddress" rows="3" value={formData.permanentAddress} autoComplete="off" onChange={handleChange} required></textarea>
        </div>

        <div className="subsection">
          <label className="subsection-label">(b) Details:</label>
          <div className="form-row">
            <div className="form-group half-width">
              <label>1. Province:</label>
              <select name="province" value={formData.province} onChange={handleChange} required>
                <option value="">Select Province...</option>
                <option value="Central Province">Central Province</option>
                <option value="Eastern Province">Eastern Province</option>
                <option value="North Central Province">North Central Province</option>
                <option value="Northern Province">Northern Province</option>
                <option value="North Western Province">North Western Province</option>
                <option value="Sabaragamuwa Province">Sabaragamuwa Province</option>
                <option value="Southern Province">Southern Province</option>
                <option value="Uva Province">Uva Province</option>
                <option value="Western Province">Western Province</option>
              </select>
            </div>
            <div className="form-group half-width">
              <label>2. District:</label>
              <select name="district" value={formData.district} onChange={handleChange} required disabled={!formData.province}>
                <option value="">Select District...</option>
                {formData.province && districtsByProvince[formData.province] ? (
                  districtsByProvince[formData.province].map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))
                ) : null}
              </select>
            </div>
          </div>
          <div className="form-group full-width">
            <label>3. Divisional Secretariat:</label>
            <input type="text" name="divisionalSecretariat" value={formData.divisionalSecretariat} onChange={handleChange} required />
          </div>
          <div className="form-group full-width distance-group">
            <label>4. Distance from residence to University of Vavuniya:</label>
            <div className="distance-input">
              <input type="number" name="distance" value={formData.distance} onChange={handleChange} required />
              <span style={{ fontWeight: 600, color: '#4a5568' }}>.KM</span>
              <button
                type="button"
                onClick={handleAutoDistance}
                className="auto-distance-btn"
                disabled={isCalculatingDistance}>
                {isCalculatingDistance ? 'Detecting...' : '📍 Auto Detect'}
              </button>
            </div>
            <p className="distance-note">
              ⚠️ Note: Please ensure that your auto-detected location is your <b>permanent address</b>. Temporary or incorrect locations may affect your application review.
            </p>
          </div>
          {(formData.travelTime || formData.userLocation) && (
            <div className="location-info-card">
              {formData.travelTime && (
                <div className="info-row">
                  <span className="info-label">Estimated Travel Time</span>
                  <span className="info-value highlight-text">{formData.travelTime} minutes</span>
                </div>
              )}
              {formData.userLocation && (
                <div className="info-row">
                  <span className="info-label">Detected Coordinates</span>
                  <span className="info-value">{formData.userLocation.lat.toFixed(5)}, {formData.userLocation.lon.toFixed(5)}</span>
                  <a
                    href={`https://www.google.com/maps?q=${formData.userLocation.lat},${formData.userLocation.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link-btn">
                    View on Map
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group full-width">
          <label>(c) Residential Telephone No:</label>
          <input type="tel" name="residentialPhone" value={formData.residentialPhone} onChange={handleChange} />
        </div>

        <div className="form-section">
          <div className="form-group inline-group">
            <label>7. Are you a differently abled person?</label>
            <select name="differentlyAbled" value={formData.differentlyAbled} onChange={handleChange}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {formData.differentlyAbled === 'Yes' && (
            <div className="form-group full-width" style={{ marginTop: '10px' }}>
              <label>If so, details of the sickness:</label>
              <input type="text" name="sicknessDetails" value={formData.sicknessDetails} onChange={handleChange} required />
            </div>
          )}
        </div>

        <div className="form-section">
          <label className="section-title">8. Details of the person to be informed in case of an emergency</label>
          <div className="form-group full-width">
            <label>Name:</label>
            <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group half-width">
              <label>Relationship:</label>
              <input type="text" name="emergencyRelationship" value={formData.emergencyRelationship} onChange={handleChange} required />
            </div>
            <div className="form-group half-width">
              <label>Contact No:</label>
              <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="form-section room-selection-section">
          <label className="section-title">Desired Room Selection (Optional)</label>
          <div className="form-group full-width">
            <label>Select a Room:</label>
            {!formData.sex ? (
              <div className="distance-note" style={{ color: '#c53030', backgroundColor: '#fff5f5', borderColor: '#feb2b2' }}>
                Please select your sex in section 2(a) first to see available rooms.
              </div>
            ) : (
              <div className="room-selection-wrapper">
                <div style={{ marginBottom: '15px' }}>
                  <div
                    className={`room-block ${selectedRoomId === '' ? 'selected' : ''} ${formData.sex === 'Male' ? 'male-block' : 'female-block'}`}
                    onClick={() => setSelectedRoomId('')}
                    style={{ maxWidth: '200px' }}
                  >
                    <div className="room-id">Any Room</div>
                    <div className="room-beds">No preference</div>
                  </div>
                </div>

                {Object.entries(
                  availableRooms.reduce((acc, room) => {
                    const floorNum = Math.floor(room.id / 100);
                    const floorName = floorNum === 1 ? 'Ground Floor' : floorNum === 2 ? '1st Floor' : floorNum === 3 ? '2nd Floor' : floorNum === 4 ? '3rd Floor' : `${floorNum - 1}th Floor`;
                    if (!acc[floorName]) acc[floorName] = [];
                    acc[floorName].push(room);
                    return acc;
                  }, {})
                ).map(([floor, rooms]) => (
                  <div key={floor} className="floor-section">
                    <h4 className="floor-title">{floor}</h4>
                    <div className="room-blocks-container" style={{ marginTop: '10px' }}>
                      {rooms.map(room => (
                        <div
                          key={room.id}
                          className={`room-block ${selectedRoomId === room.id.toString() ? 'selected' : ''} ${formData.sex === 'Male' ? 'male-block' : 'female-block'}`}
                          onClick={() => setSelectedRoomId(room.id.toString())}
                        >
                          <div className="room-id">Room {room.id}</div>
                          <div className="room-beds">{room.beds.length} available</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-section declaration-section">
          <label className="declaration">
            <input type="checkbox" name="declarationAccepted" checked={formData.declarationAccepted} onChange={handleChange} required />
            <span>9. On admission to the hostel, I accept the hostel rules and regulations applicable to the student of the campus and also I hereby declare that, upon admission to the hostel, I give my consent, the amount equivalent to the replacement value plus 25% of such value for the damage/ loss of items which are provide for my use in the hostel/ rent dues from my deposit/ Bursary/ Mahapola.</span>
          </label>
        </div>

        <div className="form-section signature-section">
          <div className="form-group full-width">
            <label>Signature of the Applicant:</label>
            <div className="signature-upload-container">
              {signaturePreview ? (
                <div className="signature-preview-box">
                  <img src={signaturePreview} alt="Processed Signature" />
                  <button type="button" onClick={clearSignature} className="clear-btn">Remove Signature</button>
                </div>
              ) : (
                <div className="signature-upload-box">
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleSignatureUpload}
                    id="signatureUpload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="signatureUpload" className="upload-btn">
                    {isUploadingSignature ? 'Processing...' : 'Upload Signature Image'}
                  </label>
                  <span className="upload-hint">Format: JPG, PNG (Max 2MB)</span>
                </div>
              )}
              {signatureError && <div className="error-text">{signatureError}</div>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn primary">
            {existingAppId && appStatus === 'Rejected' ? 'Re-submit Application' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
