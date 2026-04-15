import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js';
import commuteRoutes from './routes/commutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// ── 미들웨어 ──
app.use(cors());
app.use(express.json());

// ── API 라우트 ──
app.use('/api/users', userRoutes);
app.use('/api/commutes', commuteRoutes);

// ── 헬스체크 ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '자출본전 서버가 정상 작동 중입니다! 🚲' });
});

app.listen(PORT, () => {
  console.log(`🚲 자출본전 서버가 포트 ${PORT}에서 실행 중입니다`);
});
