import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

// ──────────────────────────────
//  사용자 (users) 컬렉션
// ──────────────────────────────

/** 사용자 실시간 구독 */
export function subscribeUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(users);
  });
}

/** 사용자 추가 */
export async function addUser(userData) {
  const docRef = await addDoc(collection(db, 'users'), {
    ...userData,
    createdAt: Date.now(),
  });
  return { id: docRef.id, ...userData };
}

/** 사용자 수정 */
export async function updateUser(userId, userData) {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, userData);
}

// ──────────────────────────────
//  출퇴근 기록 (commutes) 컬렉션
// ──────────────────────────────

/** 출퇴근 기록 실시간 구독 */
export function subscribeCommutes(callback) {
  const q = query(collection(db, 'commutes'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const commutes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(commutes);
  });
}

/** 출퇴근 기록 추가 */
export async function addCommute(commuteData) {
  const docRef = await addDoc(collection(db, 'commutes'), {
    ...commuteData,
    createdAt: Date.now(),
  });
  return { id: docRef.id, ...commuteData };
}

/** 출퇴근 기록 삭제 */
export async function deleteCommute(commuteId) {
  await deleteDoc(doc(db, 'commutes', commuteId));
}

// ──────────────────────────────
//  유가 정보 (fuelPrices) 컬렉션
// ──────────────────────────────

/** 특정 날짜 유가 조회 (없으면 latest 반환) */
export async function getFuelPrice(dateStr) {
  // 먼저 해당 날짜 유가 확인
  const dateDoc = await getDoc(doc(db, 'fuelPrices', dateStr));
  if (dateDoc.exists()) {
    return dateDoc.data();
  }
  // 없으면 최신 유가 반환
  const latestDoc = await getDoc(doc(db, 'fuelPrices', 'latest'));
  if (latestDoc.exists()) {
    return latestDoc.data();
  }
  return null;
}

/** 최신 유가 실시간 구독 */
export function subscribeLatestFuelPrice(callback) {
  return onSnapshot(doc(db, 'fuelPrices', 'latest'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
}
