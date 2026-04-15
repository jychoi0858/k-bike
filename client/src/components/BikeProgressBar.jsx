import React, { useState } from 'react';
import '../styles/BikeProgressBar.css';

/**
 * 자전거 프로그레스바 컴포넌트
 * - 등록된 모든 사용자의 프로그레스바를 표시
 * - 각 바 앞에 사용자 이름 표시
 * - 클릭하면 상세 정보 팝업
 */
function BikeProgressBar({ users, commutes, onSelectUser, currentUserId, onEditUser }) {
  const [popupUser, setPopupUser] = useState(null);

  const formatMoney = (amount) => {
    return Math.floor(amount).toLocaleString('ko-KR');
  };

  // 특정 사용자의 절약 정보 계산 (하루 1회 카운트)
  const getUserStats = (user) => {
    const userCommutes = commutes.filter((c) => c.userId === user.id);
    // 날짜 기준 중복 제거 → 하루에 출근/퇴근/둘다 해도 1일로 카운트
    const uniqueDays = new Set(userCommutes.map((c) => c.date));
    const totalDays = uniqueDays.size;
    const totalTrips = userCommutes.length; // 출근/퇴근 각각 1건 = 왕복 금액 계산용
    const savedAmount = totalTrips * user.costPerTrip;
    const progress = user.bikeCost > 0 ? Math.min((savedAmount / user.bikeCost) * 100, 100) : 0;
    const remaining = Math.max(user.bikeCost - savedAmount, 0);

    // 남은 일수 계산: 하루 평균 절약액 기준
    // 왕복(출+퇴) = 1일, 편도 = 0.5일
    const dailyRate = user.costPerTrip * 2; // 하루 왕복 절약액
    const remainingDays = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : 0;

    return { totalDays, savedAmount, progress, remaining, remainingDays };
  };

  // 프로그레스바 클릭 → 상세 팝업 + 해당 사용자 선택
  const handleBarClick = (user) => {
    onSelectUser(user);
    setPopupUser(popupUser?.id === user.id ? null : user);
  };

  // 팝업 닫기
  const closePopup = () => setPopupUser(null);

  return (
    <div className="progress-section">
      <div className="progress-header">
        <h2 className="progress-title">🚲 본전까지 달리는 중...</h2>
      </div>

      {/* 사용자가 없을 때 */}
      {users.length === 0 && (
        <div className="no-users-message">
          우측 상단 ➕ 등록 버튼으로 사용자를 추가해보세요!
        </div>
      )}

      {/* 등록된 사용자별 프로그레스바 */}
      <div className="user-bars">
        {users.map((user) => {
          const { totalDays, savedAmount, progress } = getUserStats(user);
          const isComplete = progress >= 100;
          const isSelected = currentUserId === user.id;

          return (
            <div
              key={user.id}
              className={`user-bar-row ${isSelected ? 'selected' : ''}`}
              onClick={() => handleBarClick(user)}
            >
              {/* 이름 */}
              <div className="user-bar-name">
                {isComplete ? '🎉' : ''} {user.name}
              </div>

              {/* 프로그레스바 트랙 */}
              <div className="user-bar-track">
                <div
                  className="user-bar-fill"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="user-bike-icon"
                  style={{ left: `${progress}%` }}
                >
                  <span className="bike-percent">{progress.toFixed(1)}%</span>
                  <span className={progress > 0 ? 'riding' : ''}>🚲</span>
                </div>
              </div>

              {/* 금액 요약 */}
              <div className="user-bar-amount">
                {formatMoney(savedAmount)}원 / {formatMoney(user.bikeCost)}원
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세 정보 팝업 */}
      {popupUser && (
        <>
          <div className="popup-backdrop" onClick={closePopup} />
          <div className="stats-popup">
            <button className="popup-close" onClick={closePopup}>✕</button>
            <div className="popup-name">{popupUser.name}</div>
            {(() => {
              const stats = getUserStats(popupUser);
              return (
                <div className="popup-cards">
                  <div className="popup-card">
                    <div className="popup-card-icon">📊</div>
                    <div className="popup-card-value">{stats.progress.toFixed(1)}%</div>
                    <div className="popup-card-label">달성률</div>
                  </div>
                  <div className="popup-card">
                    <div className="popup-card-icon">🚌</div>
                    <div className="popup-card-value">{stats.totalDays}일</div>
                    <div className="popup-card-label">총 출퇴근</div>
                  </div>
                  <div className="popup-card">
                    <div className="popup-card-icon">💵</div>
                    <div className="popup-card-value">{formatMoney(stats.remaining)}원</div>
                    <div className="popup-card-label">남은 금액</div>
                  </div>
                  <div className="popup-card">
                    <div className="popup-card-icon">💰</div>
                    <div className="popup-card-value">{formatMoney(stats.savedAmount)}원</div>
                    <div className="popup-card-label">절약한 금액</div>
                  </div>
                  <div className="popup-card popup-card-wide">
                    <div className="popup-card-icon">📅</div>
                    <div className="popup-card-value">
                      {stats.progress >= 100 ? '🎉 본전 달성!' : `${stats.remainingDays}일`}
                    </div>
                    <div className="popup-card-label">
                      {stats.progress >= 100 ? '' : '본전까지 남은 일수 (왕복 기준)'}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="popup-footer">
              편도 {popupUser.distance}km · 편도 교통비 {popupUser.costPerTrip.toLocaleString()}원
            </div>
            <button
              className="popup-edit-btn"
              onClick={() => { onEditUser(popupUser); closePopup(); }}
            >
              ✏️ 정보 수정
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default BikeProgressBar;
