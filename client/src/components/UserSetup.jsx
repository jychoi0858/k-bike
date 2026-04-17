import React, { useState } from 'react';
import '../styles/UserSetup.css';

/**
 * 사용자 등록/수정 모달 컴포넌트
 * - 교통수단: 대중교통 / 휘발유 / 경유
 * - 대중교통 → 편도비용 직접 입력
 * - 휘발유/경유 → 연비 입력 (유가는 자동 수집)
 */
function UserSetup({ onSubmit, onClose, existingUser }) {
  const [name, setName] = useState(existingUser?.name || '');
  const [distance, setDistance] = useState(existingUser?.distance || '');
  const [transportType, setTransportType] = useState(existingUser?.transportType || 'public');
  const [costPerTrip, setCostPerTrip] = useState(
    existingUser?.costPerTrip ? existingUser.costPerTrip.toLocaleString('ko-KR') : ''
  );
  const [fuelEfficiency, setFuelEfficiency] = useState(existingUser?.fuelEfficiency || '');
  const [bikeCost, setBikeCost] = useState(
    existingUser?.bikeCost ? existingUser.bikeCost.toLocaleString('ko-KR') : ''
  );

  const isEditing = !!existingUser;

  const parseNumber = (str) => Number(str.replace(/,/g, ''));

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

    if (!name.trim() || !distance || !bikeCost) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    if (transportType === 'public' && !costPerTrip) {
      alert('편도 비용을 입력해주세요!');
      return;
    }

    if ((transportType === 'gasoline' || transportType === 'diesel') && !fuelEfficiency) {
      alert('연비를 입력해주세요!');
      return;
    }

    const userData = {
      name: name.trim(),
      distance: Number(distance),
      transportType,
      bikeCost: parseNumber(bikeCost),
    };

    if (transportType === 'public') {
      userData.costPerTrip = parseNumber(costPerTrip);
      userData.fuelEfficiency = null;
    } else {
      userData.fuelEfficiency = Number(fuelEfficiency);
      userData.costPerTrip = 0; // 유가 기반으로 동적 계산
    }

    onSubmit(userData);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="setup-overlay" onClick={handleOverlayClick}>
      <div className="setup-card">
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

          {/* 교통수단 선택 */}
          <div className="form-group">
            <label className="form-label">🚗 기존 교통수단</label>
            <div className="transport-selector">
              <button
                type="button"
                className={`transport-btn ${transportType === 'public' ? 'active' : ''}`}
                onClick={() => setTransportType('public')}
              >
                🚌 대중교통
              </button>
              <button
                type="button"
                className={`transport-btn ${transportType === 'gasoline' ? 'active' : ''}`}
                onClick={() => setTransportType('gasoline')}
              >
                ⛽ 휘발유
              </button>
              <button
                type="button"
                className={`transport-btn ${transportType === 'diesel' ? 'active' : ''}`}
                onClick={() => setTransportType('diesel')}
              >
                ⛽ 경유
              </button>
            </div>
          </div>

          {/* 대중교통: 편도비용 입력 */}
          {transportType === 'public' && (
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
          )}

          {/* 휘발유/경유: 연비 입력 */}
          {(transportType === 'gasoline' || transportType === 'diesel') && (
            <div className="form-group">
              <label className="form-label">⛽ 차량 연비 (km/L)</label>
              <input
                type="number"
                className="form-input"
                placeholder="12"
                min="1"
                step="0.1"
                value={fuelEfficiency}
                onChange={(e) => setFuelEfficiency(e.target.value)}
              />
              <p className="form-hint">
                유가는 매일 자동으로 업데이트됩니다 (오피넷 전국 평균)
              </p>
            </div>
          )}

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
