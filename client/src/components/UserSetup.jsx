import React, { useState } from 'react';
import '../styles/UserSetup.css';

/**
 * 사용자 등록/수정 모달 컴포넌트
 * - 모달 형태로 표시 (랜딩페이지 위에 오버레이)
 * - onClose로 모달 닫기 가능
 */
function UserSetup({ onSubmit, onClose, existingUser }) {
  const [name, setName] = useState(existingUser?.name || '');
  const [distance, setDistance] = useState(existingUser?.distance || '');
  const [costPerTrip, setCostPerTrip] = useState(
    existingUser?.costPerTrip ? existingUser.costPerTrip.toLocaleString('ko-KR') : ''
  );
  const [bikeCost, setBikeCost] = useState(
    existingUser?.bikeCost ? existingUser.bikeCost.toLocaleString('ko-KR') : ''
  );

  const isEditing = !!existingUser;

  // 숫자만 추출 (콤마 제거)
  const parseNumber = (str) => Number(str.replace(/,/g, ''));

  // 입력 시 콤마 자동 포맷
  const handleMoneyChange = (value, setter) => {
    const numericOnly = value.replace(/[^0-9]/g, '');
    if (numericOnly === '') {
      setter('');
      return;
    }
    setter(Number(numericOnly).toLocaleString('ko-KR'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !distance || !costPerTrip || !bikeCost) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    onSubmit({
      name: name.trim(),
      distance: Number(distance),
      costPerTrip: parseNumber(costPerTrip),
      bikeCost: parseNumber(bikeCost),
    });
  };

  // 오버레이 클릭 시 모달 닫기 (카드 바깥 영역)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="setup-overlay" onClick={handleOverlayClick}>
      <div className="setup-card">
        {/* 닫기 버튼 */}
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="setup-header">
          <div className="setup-icon">🚲</div>
          <h2 className="setup-title">
            {isEditing ? '정보 수정' : '사용자 등록'}
          </h2>
          <p className="setup-subtitle">
            {isEditing
              ? '출퇴근 정보를 수정하세요'
              : '자전거 출퇴근으로 절약하는 교통비를 추적해보세요!'}
          </p>
        </div>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">👤 이름</label>
            <input
              type="text"
              className="form-input"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">📏 출퇴근 편도 거리 (km)</label>
            <input
              type="number"
              className="form-input"
              placeholder="10"
              min="0.1"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">🚌 대중교통 편도 비용 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder="1,500"
              value={costPerTrip}
              onChange={(e) => handleMoneyChange(e.target.value, setCostPerTrip)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">💰 자전거 구매 비용 (원)</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              placeholder="500,000"
              value={bikeCost}
              onChange={(e) => handleMoneyChange(e.target.value, setBikeCost)}
            />
          </div>

          <button type="submit" className="setup-btn">
            {isEditing ? '✅ 수정 완료' : '🚴 등록하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserSetup;
