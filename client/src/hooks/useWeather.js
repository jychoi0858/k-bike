import { useState, useEffect } from 'react';

/**
 * WMO 날씨 코드 → 이모지 매핑
 * https://open-meteo.com/en/docs 참고
 */
const weatherCodeToIcon = (code) => {
  if (code === 0) return '☀️';                        // 맑음
  if (code === 1) return '🌤️';                       // 대체로 맑음
  if (code === 2) return '⛅';                        // 구름 조금
  if (code === 3) return '☁️';                        // 흐림
  if (code === 45 || code === 48) return '🌫️';       // 안개
  if ([51, 53, 55].includes(code)) return '🌦️';      // 이슬비
  if ([56, 57].includes(code)) return '🌧️';          // 얼어붙는 이슬비
  if ([61, 63, 65].includes(code)) return '🌧️';      // 비
  if ([66, 67].includes(code)) return '🌧️';          // 얼어붙는 비
  if ([71, 73, 75, 77].includes(code)) return '🌨️';  // 눈
  if ([80, 81, 82].includes(code)) return '🌧️';      // 소나기
  if ([85, 86].includes(code)) return '🌨️';          // 눈 소나기
  if (code === 95) return '⛈️';                       // 뇌우
  if ([96, 99].includes(code)) return '⛈️';           // 우박 동반 뇌우
  return '';
};

/**
 * 날씨 데이터를 가져오는 커스텀 훅
 * - Open-Meteo API 사용 (무료, API 키 불필요)
 * - 서울 좌표 기본값 (위도 37.5665, 경도 126.978)
 *
 * @param {number} year
 * @param {number} month - 0부터 시작 (JavaScript Date 기준)
 * @returns {{ weatherMap: Object, loading: boolean }}
 */
function useWeather(year, month, lat = 37.5665, lon = 126.978) {
  const [weatherMap, setWeatherMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);

      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const today = new Date();
      const endDateObj = new Date(year, month, lastDay);

      try {
        let allDates = [];
        let allCodes = [];

        // 과거 날짜: archive API 사용
        const pastEndDate = endDateObj > today
          ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          : endDate;

        if (new Date(startDate) <= today) {
          const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${pastEndDate}&daily=weather_code&timezone=Asia/Seoul`;
          const archiveRes = await fetch(archiveUrl);
          if (archiveRes.ok) {
            const archiveData = await archiveRes.json();
            if (archiveData.daily) {
              allDates.push(...(archiveData.daily.time || []));
              allCodes.push(...(archiveData.daily.weather_code || []));
            }
          }
        }

        // 미래 날짜: forecast API 사용
        if (endDateObj > today) {
          const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code&timezone=Asia/Seoul&start_date=${startDate}&end_date=${endDate}`;
          const forecastRes = await fetch(forecastUrl);
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            if (forecastData.daily) {
              // 과거와 겹치지 않는 날짜만 추가
              const existingDates = new Set(allDates);
              forecastData.daily.time.forEach((date, i) => {
                if (!existingDates.has(date)) {
                  allDates.push(date);
                  allCodes.push(forecastData.daily.weather_code[i]);
                }
              });
            }
          }
        }

        // 날짜 → 아이콘 맵 생성
        const map = {};
        allDates.forEach((date, i) => {
          const code = allCodes[i];
          if (code !== null && code !== undefined) {
            map[date] = weatherCodeToIcon(code);
          }
        });

        setWeatherMap(map);
      } catch (err) {
        console.warn('날씨 데이터 로드 실패:', err);
        setWeatherMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [year, month, lat, lon]);

  return { weatherMap, loading };
}

export default useWeather;
