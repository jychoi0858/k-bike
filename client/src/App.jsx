import React, { useState, useEffect } from 'react';
import BikeProgressBar from './components/BikeProgressBar';
import Calendar from './components/Calendar';
import UserSetup from './components/UserSetup';
import CITY_LIST from './data/cities';
import './styles/App.css';

/**
 * ──────────────────────────────────────
 *  자출본전 - 메인 App 컴포넌트
 * ──────────────────────────────────────
 */
function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [commutes, setCommutes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // 날씨 지역 설정
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('bikeTracker_location');
    return saved ? JSON.parse(saved) : CITY_LIST[0];
  });

  // ── 앱 시작 시 저장된 데이터 불러오기 ──
  useEffect(() => {
    const savedUsers = localStorage.getItem('bikeTracker_users');
    const savedCurrentUserId = localStorage.getItem('bikeTracker_currentUserId');
    const savedCommutes = localStorage.getItem('bikeTracker_commutes');

    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      setUsers(parsed);
      if (savedCurrentUserId) {
        const found = parsed.find((u) => u.id === savedCurrentUserId);
        if (found) setCurrentUser(found);
      }
    }
    if (savedCommutes) {
      setCommutes(JSON.parse(savedCommutes));
    }
  }, []);

  // ── 사용자 등록/수정 ──
  const handleUserRegister = (userData) => {
    const newUser = { ...userData, id: editingUser?.id || Date.now().toString() };

    setUsers((prev) => {
      let updated;
      if (editingUser) {
        updated = prev.map((u) => (u.id === editingUser.id ? newUser : u));
      } else {
        updated = [...prev, newUser];
      }
      localStorage.setItem('bikeTracker_users', JSON.stringify(updated));
      return updated;
    });

    setCurrentUser(newUser);
    localStorage.setItem('bikeTracker_currentUserId', newUser.id);
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('bikeTracker_currentUserId', user.id);
  };

  const handleOpenRegister = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  // ── 지역 변경 ──
  const handleLocationChange = (city) => {
    setLocation(city);
    localStorage.setItem('bikeTracker_location', JSON.stringify(city));
  };

  // ── 출퇴근 토글 ──
  const handleToggleCommute = (date, type, userId) => {
    setCommutes((prev) => {
      const existingIndex = prev.findIndex(
        (c) => c.userId === userId && c.date === date && c.type === type
      );

      let updated;
      if (existingIndex !== -1) {
        updated = prev.filter((_, i) => i !== existingIndex);
      } else {
        updated = [...prev, {
          id: Date.now().toString(),
          userId,
          date,
          type,
          createdAt: new Date().toISOString(),
        }];
      }

      localStorage.setItem('bikeTracker_commutes', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="app">
      {/* 상단 헤더 */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo">🚲</span>
          <h1 className="app-title">자출본전</h1>
        </div>
        <div className="header-right">
          <button className="register-btn" onClick={handleOpenRegister}>
            ➕ 등록
          </button>
          <button className="settings-btn" onClick={() => setShowSettings(true)}>
            ⚙️
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="app-main">
        <BikeProgressBar
          users={users}
          commutes={commutes}
          onSelectUser={handleSelectUser}
          onEditUser={handleEditUser}
          currentUserId={currentUser?.id}
        />

        <Calendar
          users={users}
          commutes={commutes}
          onToggleCommute={handleToggleCommute}
          location={location}
        />
      </main>

      {/* 푸터 */}
      <footer className="app-footer">
        <p>자전거 출퇴근으로 교통비를 절약하세요!</p>
      </footer>

      {/* 사용자 등록/수정 모달 */}
      {showModal && (
        <UserSetup
          onSubmit={handleUserRegister}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          existingUser={editingUser}
        />
      )}

      {/* 설정 팝업 */}
      {showSettings && (
        <>
          <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
          <div className="settings-popup">
            <button className="settings-popup-close" onClick={() => setShowSettings(false)}>✕</button>
            <h3 className="settings-title">⚙️ 설정</h3>

            <div className="settings-section">
              <div className="settings-label">📍 날씨 지역</div>
              <div className="settings-city-grid">
                {CITY_LIST.map((city) => (
                  <button
                    key={city.name}
                    className={`settings-city-btn ${location.name === city.name ? 'active' : ''}`}
                    onClick={() => handleLocationChange(city)}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              <p className="settings-current">현재: 📍 {location.name}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
