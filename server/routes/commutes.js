import { Router } from 'express';

const router = Router();

// ──────────────────────────────────────────────
// 지금은 메모리에 저장 (나중에 DB로 교체 예정)
// ──────────────────────────────────────────────
let commutes = [];

// 출퇴근 기록 등록/토글
// body: { userId, date, type: 'commute_to' | 'commute_from' }
router.post('/', (req, res) => {
  const { userId, date, type } = req.body;

  if (!userId || !date || !type) {
    return res.status(400).json({ error: '필수 필드가 누락되었습니다' });
  }

  // 이미 같은 날짜, 같은 타입의 기록이 있으면 삭제 (토글)
  const existingIndex = commutes.findIndex(
    (c) => c.userId === userId && c.date === date && c.type === type
  );

  if (existingIndex !== -1) {
    commutes.splice(existingIndex, 1);
    return res.json({ removed: true, date, type });
  }

  const commute = {
    id: Date.now().toString(),
    userId,
    date,    // 'YYYY-MM-DD' 형식
    type,    // 'commute_to' (출근) 또는 'commute_from' (퇴근)
    createdAt: new Date().toISOString(),
  };

  commutes.push(commute);
  res.status(201).json(commute);
});

// 특정 사용자의 출퇴근 기록 조회
router.get('/:userId', (req, res) => {
  const userCommutes = commutes.filter((c) => c.userId === req.params.userId);
  res.json(userCommutes);
});

// 특정 사용자의 월별 출퇴근 기록 조회
router.get('/:userId/:year/:month', (req, res) => {
  const { userId, year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}`;

  const monthCommutes = commutes.filter(
    (c) => c.userId === userId && c.date.startsWith(prefix)
  );
  res.json(monthCommutes);
});

export default router;
