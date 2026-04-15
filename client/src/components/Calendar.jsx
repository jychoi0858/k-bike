import React, { useState } from 'react';
import useWeather from '../hooks/useWeather';
import '../styles/Calendar.css';

/**
 * 달력 컴포넌트 (공용)
 * - 모든 사용자의 출퇴근 기록을 캘린더에 표시
 * - 날짜 클릭 → 팝업에서 사용자를 선택한 뒤 출퇴근 등록
 * - 날씨 아이콘 표시 (Open-Meteo API)
 */
function Calendar({ users, commutes, onToggleCommute, location }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [filterUserId, setFilterUserId] = useState(null); // 캘린더 필터

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 날씨 데이터 가져오기 (선택한 지역 좌표 사용)
  const { weatherMap } = useWeather(year, month, location.lat, location.lon);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const goToPrevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null); };
  const goToNextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null); };

  const formatDate = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // 사용자 이름 가져오기
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : '?';
  };

  // 특정 날짜의 출퇴근 기록 (필터 적용)
  const getDateCommutes = (dateStr) => {
    let filtered = commutes.filter((c) => c.date === dateStr);
    if (filterUserId) {
      filtered = filtered.filter((c) => c.userId === filterUserId);
    }
    return filtered;
  };

  // 특정 날짜 + 특정 사용자의 출퇴근 상태
  const getUserCommuteStatus = (dateStr, userId) => {
    const hasCommuteTo = commutes.some(
      (c) => c.date === dateStr && c.userId === userId && c.type === 'commute_to'
    );
    const hasCommuteFrom = commutes.some(
      (c) => c.date === dateStr && c.userId === userId && c.type === 'commute_from'
    );
    return { hasCommuteTo, hasCommuteFrom };
  };

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDateClick = (day) => {
    if (users.length === 0) return;
    const dateStr = formatDate(year, month, day);
    setSelectedDate(dateStr);
    setSelectedUserId(null); // 사용자 선택 초기화
  };

  const handleCommuteToggle = (type) => {
    if (selectedDate && selectedUserId) {
      onToggleCommute(selectedDate, type, selectedUserId);
    }
  };

  // 달력 셀에 표시할 뱃지 생성
  const renderCellBadges = (dateStr) => {
    const dayCommutes = getDateCommutes(dateStr);
    if (dayCommutes.length === 0) return null;

    // 사용자별로 그룹핑
    const userMap = {};
    dayCommutes.forEach((c) => {
      if (!userMap[c.userId]) userMap[c.userId] = { to: false, from: false };
      if (c.type === 'commute_to') userMap[c.userId].to = true;
      if (c.type === 'commute_from') userMap[c.userId].from = true;
    });

    return (
      <div className="commute-badges">
        {Object.entries(userMap).map(([userId, status]) => {
          const name = getUserName(userId);
          let badgeClass;
          if (status.to && status.from) {
            badgeClass = 'badge badge-full';
          } else if (status.to) {
            badgeClass = 'badge badge-to';
          } else {
            badgeClass = 'badge badge-from';
          }
          return (
            <span key={userId} className={badgeClass} title={name}>{name}</span>
          );
        })}
      </div>
    );
  };

  // 날짜 셀에 기록이 있는지 확인 (필터 적용)
  const hasAnyCommute = (dateStr) => {
    if (filterUserId) {
      return commutes.some((c) => c.date === dateStr && c.userId === filterUserId);
    }
    return commutes.some((c) => c.date === dateStr);
  };

  const renderDays = () => {
    const cells = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const isFuture = new Date(year, month, day) > today;
      const hasCommute = hasAnyCommute(dateStr);

      let cellClass = 'calendar-cell';
      if (isToday) cellClass += ' today';
      if (isSelected) cellClass += ' selected';
      if (isFuture) cellClass += ' future';
      if (hasCommute) cellClass += ' has-commute';

      const weatherIcon = weatherMap[dateStr] || '';

      cells.push(
        <div
          key={day}
          className={cellClass}
          onClick={() => !isFuture && handleDateClick(day)}
        >
          <div className="day-top">
            <span className="day-number">{day}</span>
            {weatherIcon && <span className="weather-icon">{weatherIcon}</span>}
          </div>
          {renderCellBadges(dateStr)}
        </div>
      );
    }

    return cells;
  };

  // 팝업에서 선택된 사용자의 상태
  const popupUserStatus = (selectedDate && selectedUserId)
    ? getUserCommuteStatus(selectedDate, selectedUserId)
    : null;

  return (
    <div className="calendar-section">
      {/* 달력 헤더 */}
      <div className="calendar-header">
        <button className="nav-btn" onClick={goToPrevMonth}>◀</button>
        <h3 className="calendar-month">{year}년 {month + 1}월</h3>
        <button className="nav-btn" onClick={goToNextMonth}>▶</button>
      </div>

      {/* 사용자 필터 */}
      {users.length > 0 && (
        <div className="calendar-filter">
          <button
            className={`filter-btn ${!filterUserId ? 'active' : ''}`}
            onClick={() => setFilterUserId(null)}
          >
            전체
          </button>
          {users.map((u) => (
            <button
              key={u.id}
              className={`filter-btn ${filterUserId === u.id ? 'active' : ''}`}
              onClick={() => setFilterUserId(filterUserId === u.id ? null : u.id)}
            >
              {u.name}
            </button>
          ))}
        </div>
      )}

      {/* 색상 범례 */}
      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot dot-to" />출근</span>
        <span className="legend-item"><span className="legend-dot dot-from" />퇴근</span>
        <span className="legend-item"><span className="legend-dot dot-full" />출퇴근</span>
      </div>

      {/* 요일 헤더 */}
      <div className="calendar-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div key={day} className={`weekday ${i === 0 ? 'sun' : ''} ${i === 6 ? 'sat' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      {/* 달력 본체 */}
      <div className="calendar-grid">
        {renderDays()}
      </div>

      {/* 출퇴근 등록 팝업 */}
      {selectedDate && (
        <>
          <div className="commute-popup-backdrop" onClick={() => setSelectedDate(null)} />
          <div className="commute-popup">
            <button className="commute-popup-close" onClick={() => setSelectedDate(null)}>✕</button>
            <div className="panel-date">
              📅 {selectedDate.replace(/-/g, '.')}
            </div>

            {/* 사용자 선택 */}
            <div className="popup-user-select">
              <div className="popup-user-label">사용자 선택</div>
              <div className="popup-user-list">
                {users.map((u) => {
                  const status = getUserCommuteStatus(selectedDate, u.id);
                  const hasRecord = status.hasCommuteTo || status.hasCommuteFrom;
                  return (
                    <button
                      key={u.id}
                      className={`popup-user-btn ${selectedUserId === u.id ? 'active' : ''} ${hasRecord ? 'has-record' : ''}`}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <span className="popup-user-name">{u.name}</span>
                      {hasRecord && (
                        <span className="popup-user-status">
                          {status.hasCommuteTo && '출'}
                          {status.hasCommuteTo && status.hasCommuteFrom && '·'}
                          {status.hasCommuteFrom && '퇴'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 사용자 선택 후 출퇴근 버튼 */}
            {selectedUserId ? (
              <>
                <div className="panel-buttons">
                  <button
                    className={`commute-btn btn-to ${popupUserStatus?.hasCommuteTo ? 'active' : ''}`}
                    onClick={() => handleCommuteToggle('commute_to')}
                  >
                    {popupUserStatus?.hasCommuteTo ? '✅ 출근 완료' : '🌅 출근 등록'}
                  </button>
                  <button
                    className={`commute-btn btn-from ${popupUserStatus?.hasCommuteFrom ? 'active' : ''}`}
                    onClick={() => handleCommuteToggle('commute_from')}
                  >
                    {popupUserStatus?.hasCommuteFrom ? '✅ 퇴근 완료' : '🌆 퇴근 등록'}
                  </button>
                </div>
                <p className="panel-tip">
                  {popupUserStatus?.hasCommuteTo || popupUserStatus?.hasCommuteFrom
                    ? '다시 누르면 등록이 취소됩니다'
                    : '버튼을 눌러 출퇴근을 기록하세요'}
                </p>
              </>
            ) : (
              <p className="panel-tip">위에서 사용자를 선택해주세요</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Calendar;
