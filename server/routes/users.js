import { Router } from 'express';

const router = Router();

// ──────────────────────────────────────────────
// 지금은 메모리에 저장 (나중에 DB로 교체 예정)
// ──────────────────────────────────────────────
let users = [];

// 사용자 등록
router.post('/', (req, res) => {
  const { name, distance, costPerTrip, bikeCost } = req.body;

  if (!name || !distance || !costPerTrip || !bikeCost) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요' });
  }

  const user = {
    id: Date.now().toString(),
    name,
    distance: Number(distance),         // 편도 거리 (km)
    costPerTrip: Number(costPerTrip),   // 편도 대중교통 비용 (원)
    bikeCost: Number(bikeCost),         // 자전거 구매 비용 (원)
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  res.status(201).json(user);
});

// 사용자 목록 조회
router.get('/', (req, res) => {
  res.json(users);
});

// 특정 사용자 조회
router.get('/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
  res.json(user);
});

export default router;
