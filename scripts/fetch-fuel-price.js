/**
 * 오피넷 API에서 전국 평균 유가를 가져와 Firebase에 저장하는 스크립트
 * GitHub Actions에서 매일 실행됨
 */
const https = require('https');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin 초기화
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// HTTPS GET 요청 헬퍼
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          // http로 리다이렉트될 경우 대비
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON 파싱 실패: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

function fetchHTTP(url) {
  const http = require('http');
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON 파싱 실패: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const apiKey = process.env.OPINET_API_KEY;
  if (!apiKey) {
    console.error('OPINET_API_KEY 환경변수가 없습니다.');
    process.exit(1);
  }

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  console.log(`[${dateStr}] 유가 데이터 수집 시작...`);

  try {
    // 오피넷 전국 평균 유가 API (certkey 파라미터 사용)
    const url = `http://www.opinet.co.kr/api/avgAllPrice.do?certkey=${apiKey}&out=json`;
    console.log('API 호출 중...');
    const result = await fetchHTTP(url);
    console.log('응답:', JSON.stringify(result).substring(0, 500));

    if (!result.RESULT || !result.RESULT.OIL || result.RESULT.OIL.length === 0) {
      console.error('유가 데이터가 비어있습니다.');
      process.exit(1);
    }

    const oils = result.RESULT.OIL;

    console.log('유가 데이터:', JSON.stringify(oils, null, 2));

    // PRODCD 코드로 찾기, 없으면 PRODNM(제품명)으로 찾기
    const gasoline = oils.find((o) => o.PRODCD === 'B027' || o.PRODNM === '휘발유');
    const diesel = oils.find((o) => o.PRODCD === 'D047' || o.PRODNM === '경유');

    if (!gasoline || !diesel) {
      console.error('휘발유/경유 데이터를 찾을 수 없습니다.');
      console.error('사용 가능한 제품:', oils.map((o) => `${o.PRODCD}(${o.PRODNM})`).join(', '));
      process.exit(1);
    }

    const fuelData = {
      date: dateStr,
      gasoline: Math.round(gasoline.PRICE),  // 휘발유 전국 평균 (원/L)
      diesel: Math.round(diesel.PRICE),       // 경유 전국 평균 (원/L)
      updatedAt: Date.now(),
    };

    // Firebase에 저장 (날짜를 문서 ID로 사용)
    await db.collection('fuelPrices').doc(dateStr).set(fuelData);

    // 최신 유가로 'latest' 문서도 업데이트
    await db.collection('fuelPrices').doc('latest').set(fuelData);

    console.log(`✅ 저장 완료 - 휘발유: ${fuelData.gasoline}원/L, 경유: ${fuelData.diesel}원/L`);
  } catch (err) {
    console.error('유가 수집 실패:', err.message);
    process.exit(1);
  }
}

main();
