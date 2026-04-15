import React, { useState, useEffect } from 'react';
import BikeProgressBar from './components/BikeProgressBar';
import Calendar from './components/Calendar';
import UserSetup from './components/UserSetup';
import CITY_LIST from './data/cities';
import {
  subscribeUsers,
  addUser,
  updateUser,
  subscribeCommutes,
  addCommute,
  deleteCommute,
} from './services/firestore';
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

  // 날씨 지역 설정 (개인 설정이라 localStorage 유지)
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('bikeTracker_location');
    return saved ? JSON.parse(saved) : CITY_LIST[0];
  });

  // ── Firestore 실시간 구독 ──
  useEffect(() => {
    const unsubUsers = subscribeUsers((data) => {
      setUsers(data);
      const savedId = localStorage.getItem('bikeTracker_currentUserId');
      if (savedId) {
        const found = data.find((u) => u.id === savedId);
        if (found) setCurrentUser(found);
      }
    });

    const unsubCommutes = subscribeCommutes((data) => {
      setCommutes(data);
    });

    return () => {
      unsubUsers();
      unsubCommutes();
    };
  }, []);

  // ── 사용자 등록/수정 ──
  const handleUserRegister = async (userData) => {
    if (editingUser) {
      await updateUser(editingUser.id, userData);
      const updated = { ...editingUser, ...userData };
      setCurrentUser(updated);
      localStorage.setItem('bikeTracker_currentUserId', editingUser.id);
    } else {
      const newUser = await addUser(userData);
      setCurrentUser(newUser);
      localStorage.setItem('bikeTracker_currentUserId', newUser.id);
    }
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
  const handleToggleCommute = async (date, type, userId) => {
    const existing = commutes.find(
      (c) => c.userId === userId && c.date === date && c.type === type
    );

    if (existing) {
      await deleteCommute(existing.id);
    } else {
      await addCommute({ userId, date, type });
    }
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
