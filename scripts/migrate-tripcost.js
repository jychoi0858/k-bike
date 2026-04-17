/**
 * 기존 출퇴근 기록에 tripCost가 없는 데이터를 일괄 업데이트하는 마이그레이션 스크립트
 * - 대중교통 사용자: costPerTrip 값 사용
 * - 휘발유/경유 사용자: (편도거리 / 연비) × 유가 계산
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  console.log('마이그레이션 시작...');

  // 1. 모든 사용자 가져오기
  const usersSnap = await db.collection('users').get();
  const users = {};
  usersSnap.forEach((doc) => {
    users[doc.id] = { id: doc.id, ...doc.data() };
  });
  console.log(`사용자 ${Object.keys(users).length}명 로드`);

  // 2. 최신 유가 가져오기
  const latestFuel = await db.collection('fuelPrices').doc('latest').get();
  const fuelData = latestFuel.exists ? latestFuel.data() : null;
  if (fuelData) {
    console.log(`유가 데이터: 휘발유 ${fuelData.gasoline}원/L, 경유 ${fuelData.diesel}원/L`);
  }

  // 3. tripCost가 없는 출퇴근 기록 찾아서 업데이트
  const commutesSnap = await db.collection('commutes').get();
  let updated = 0;
  let skipped = 0;

  const batch = db.batch();

  commutesSnap.forEach((doc) => {
    const data = doc.data();

    const user = users[data.userId];
    if (!user) {
      console.log(`사용자 ${data.userId} 찾을 수 없음 - 스킵`);
      skipped++;
      return;
    }

    let tripCost = 0;
    let fuelPrice = null;

    if (!user.transportType || user.transportType === 'public') {
      tripCost = user.costPerTrip || 0;
    } else if (fuelData && user.fuelEfficiency > 0) {
      fuelPrice = user.transportType === 'gasoline' ? fuelData.gasoline : fuelData.diesel;
      tripCost = Math.round((user.distance / user.fuelEfficiency) * fuelPrice);
    }

    if (tripCost > 0) {
      const updateData = { tripCost };
      if (fuelPrice != null) updateData.fuelPrice = fuelPrice;
      batch.update(doc.ref, updateData);
      updated++;
    } else {
      skipped++;
    }
  });

  if (updated > 0) {
    await batch.commit();
  }

  console.log(`✅ 완료 - ${updated}건 업데이트, ${skipped}건 스킵`);
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});
