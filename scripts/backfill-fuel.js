/**
 * 과거 날짜에 유가 데이터를 일괄 채워넣는 스크립트
 * 3월: 1,800원/L 고정, 4월: 최신 유가 적용
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  // 최신 유가 가져오기 (4월용)
  const latestDoc = await db.collection('fuelPrices').doc('latest').get();
  const latest = latestDoc.exists ? latestDoc.data() : { gasoline: 1800, diesel: 1600 };
  console.log(`4월 기준 유가 - 휘발유: ${latest.gasoline}원/L, 경유: ${latest.diesel}원/L`);
  console.log(`3월 기준 유가 - 휘발유: 1800원/L, 경유: 1600원/L`);

  const startDate = new Date(2026, 2, 1); // 3월 1일
  const endDate = new Date(); // 오늘

  const batch = db.batch();
  let count = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 3월이면 1800원, 4월이면 최신 유가
    const isMarch = d.getMonth() === 2;
    const gasoline = isMarch ? 1800 : latest.gasoline;
    const diesel = isMarch ? 1600 : latest.diesel;

    batch.set(db.collection('fuelPrices').doc(dateStr), {
      date: dateStr,
      gasoline,
      diesel,
      updatedAt: Date.now(),
    });
    count++;
    console.log(`${dateStr} - 휘발유 ${gasoline}원/L`);
  }

  if (count > 0) {
    await batch.commit();
  }
  console.log(`✅ 유가 데이터 ${count}일치 저장 완료`);

  // 출퇴근 기록도 재계산
  console.log('\n출퇴근 기록 tripCost 재계산 시작...');

  const usersSnap = await db.collection('users').get();
  const users = {};
  usersSnap.forEach((doc) => { users[doc.id] = { id: doc.id, ...doc.data() }; });

  const commutesSnap = await db.collection('commutes').get();
  const batch2 = db.batch();
  let updated = 0;

  commutesSnap.forEach((doc) => {
    const data = doc.data();
    const user = users[data.userId];
    if (!user) return;

    let tripCost = 0;
    let fuelPrice = null;

    if (!user.transportType || user.transportType === 'public') {
      tripCost = user.costPerTrip || 0;
    } else if (user.fuelEfficiency > 0) {
      // 해당 날짜의 유가 사용
      const commDate = new Date(data.date);
      const isMarch = commDate.getMonth() === 2;
      fuelPrice = user.transportType === 'gasoline'
        ? (isMarch ? 1800 : latest.gasoline)
        : (isMarch ? 1600 : latest.diesel);
      tripCost = Math.round((user.distance / user.fuelEfficiency) * fuelPrice);
    }

    if (tripCost > 0) {
      const updateData = { tripCost };
      if (fuelPrice != null) updateData.fuelPrice = fuelPrice;
      batch2.update(doc.ref, updateData);
      updated++;
    }
  });

  if (updated > 0) {
    await batch2.commit();
  }
  console.log(`✅ 출퇴근 기록 ${updated}건 재계산 완료`);
}

main().catch((err) => {
  console.error('실패:', err);
  process.exit(1);
});
