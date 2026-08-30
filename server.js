import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

import db, { initDb } from './database.js';
import { authenticateToken, JWT_SECRET } from './authMiddleware.js';
import { generateBoxAmounts } from './challengeHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Schema
initDb();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve Static Frontend Assets in Production or Dev dist
app.use(express.static(path.join(__dirname, 'dist')));

// ====================================================
// AUTHENTICATION ENDPOINTS
// ====================================================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.trim().length < 3 || password.length < 4) {
      return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل وكلمة المرور 4 أحرف' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      return res.status(400).json({ error: 'اسم المستخدم مسجل بالفعل، يرجى اختيار اسم آخر' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username.trim(), password_hash);

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ id: userId, username: username.trim() }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    return res.json({ message: 'تم إنشاء الحساب بنجاح', token, user: { id: userId, username: username.trim() } });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
    return res.json({ message: 'تم تسجيل الدخول بنجاح', token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'تم تسجيل الخروج بنجاح' });
});

// Get Current User
app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// ====================================================
// SAVING CHALLENGE ENDPOINTS
// ====================================================

// Get Current Challenge & Boxes
app.get('/api/challenge', authenticateToken, (req, res) => {
  try {
    const challenge = db.prepare('SELECT * FROM challenges WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1').get(req.user.id);
    
    if (!challenge) {
      return res.json({ challenge: null, boxes: [], pendingBox: null });
    }

    const boxes = db.prepare('SELECT * FROM boxes WHERE challenge_id = ? ORDER BY box_number ASC').all(challenge.id);

    let pendingBox = null;
    if (challenge.pending_box_id) {
      pendingBox = boxes.find(b => b.id === challenge.pending_box_id) || null;
    }

    // Calculate Summary
    const totalSaved = boxes.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.amount, 0);
    const completedCount = boxes.filter(b => b.status === 'completed').length;
    const progressPercent = Math.min(100, Math.round((totalSaved / challenge.target_amount) * 100));

    return res.json({
      challenge: {
        ...challenge,
        totalSaved,
        completedCount,
        progressPercent
      },
      boxes,
      pendingBox
    });
  } catch (err) {
    console.error('Get challenge error:', err);
    return res.status(500).json({ error: 'فشل في جلب بيانات التحدي' });
  }
});

// Onboarding Wizard - Create Challenge
app.post('/api/challenge/wizard', authenticateToken, (req, res) => {
  try {
    const { targetAmount, boxCount, maxPerBox, title } = req.body;

    const numTarget = parseFloat(targetAmount);
    const numBoxes = parseInt(boxCount, 10);
    const numMax = parseFloat(maxPerBox);

    if (!numTarget || numTarget <= 0 || !numBoxes || numBoxes <= 0 || !numMax || numMax <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال قيم صحيحة وموجبة لجميع الحقول' });
    }

    const boxAmounts = generateBoxAmounts(numTarget, numBoxes, numMax);

    // Deactivate previous challenges for this user
    db.prepare('UPDATE challenges SET is_active = 0 WHERE user_id = ?').run(req.user.id);

    // Insert new challenge
    const insertChallenge = db.prepare(`
      INSERT INTO challenges (user_id, title, target_amount, box_count, max_per_box)
      VALUES (?, ?, ?, ?, ?)
    `);
    const challengeResult = insertChallenge.run(
      req.user.id,
      title?.trim() || 'تحدي التوفير الرقمي',
      numTarget,
      numBoxes,
      numMax
    );

    const challengeId = challengeResult.lastInsertRowid;

    // Insert all generated boxes in transaction
    const insertBox = db.prepare(`
      INSERT INTO boxes (challenge_id, box_number, amount, status)
      VALUES (?, ?, ?, 'pending')
    `);

    const transaction = db.transaction((amounts) => {
      amounts.forEach((amt, index) => {
        insertBox.run(challengeId, index + 1, amt);
      });
    });

    transaction(boxAmounts);

    return res.json({ message: 'تم إعداد تحدي التوفير بنجاح!', challengeId });
  } catch (err) {
    console.error('Wizard error:', err);
    return res.status(400).json({ error: err.message || 'حدث خطأ أثناء إعداد التحدي' });
  }
});

// Reset Challenge
app.post('/api/challenge/reset', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE challenges SET is_active = 0 WHERE user_id = ?').run(req.user.id);
    return res.json({ message: 'تم إعادة ضبط التحدي بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء إعادة ضبط التحدي' });
  }
});

// Pick Random Uncompleted Box
app.post('/api/challenge/random-pick', authenticateToken, (req, res) => {
  try {
    const challenge = db.prepare('SELECT id FROM challenges WHERE user_id = ? AND is_active = 1 LIMIT 1').get(req.user.id);
    if (!challenge) {
      return res.status(404).json({ error: 'لم يتم العثور على تحدي نشط' });
    }

    const { excludeBoxId } = req.body;

    let query = "SELECT * FROM boxes WHERE challenge_id = ? AND status = 'pending'";
    let params = [challenge.id];

    if (excludeBoxId) {
      query += " AND id != ?";
      params.push(excludeBoxId);
    }

    let uncompletedBoxes = db.prepare(query).all(...params);

    // If excluding left no boxes but uncompleted boxes still exist, query all uncompleted
    if (uncompletedBoxes.length === 0 && excludeBoxId) {
      uncompletedBoxes = db.prepare("SELECT * FROM boxes WHERE challenge_id = ? AND status = 'pending'").all(challenge.id);
    }

    if (uncompletedBoxes.length === 0) {
      return res.status(400).json({ error: 'تهانينا! تم إكمال جميع الصناديق في هذا التحدي 🎉' });
    }

    const randomBox = uncompletedBoxes[Math.floor(Math.random() * uncompletedBoxes.length)];
    return res.json({ box: randomBox });
  } catch (err) {
    console.error('Random pick error:', err);
    return res.status(500).json({ error: 'فشل السحب العشوائي' });
  }
});

// Accept Transfer - Sets pending_box_id
app.post('/api/challenge/accept-transfer', authenticateToken, (req, res) => {
  try {
    const { boxId } = req.body;
    const challenge = db.prepare('SELECT id FROM challenges WHERE user_id = ? AND is_active = 1 LIMIT 1').get(req.user.id);
    if (!challenge) {
      return res.status(404).json({ error: 'لا يوجد تحدي نشط' });
    }

    db.prepare('UPDATE challenges SET pending_box_id = ? WHERE id = ?').run(boxId, challenge.id);
    return res.json({ message: 'تم تسجيل الطلب قيد التحويل، سيظهر تذكيرك بالتحويل' });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ حالة التحويل' });
  }
});

// Confirm Pending Transfer - Marks box completed, clears pending_box_id
app.post('/api/challenge/confirm-transfer', authenticateToken, (req, res) => {
  try {
    const challenge = db.prepare('SELECT * FROM challenges WHERE user_id = ? AND is_active = 1 LIMIT 1').get(req.user.id);
    if (!challenge || !challenge.pending_box_id) {
      return res.status(400).json({ error: 'لا يوجد مبلغ معلق في انتظار التأكيد' });
    }

    const boxId = challenge.pending_box_id;
    
    // Mark box completed
    db.prepare("UPDATE boxes SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(boxId);
    
    // Clear pending_box_id
    db.prepare('UPDATE challenges SET pending_box_id = NULL WHERE id = ?').run(challenge.id);

    const completedBox = db.prepare('SELECT * FROM boxes WHERE id = ?').get(boxId);

    return res.json({ message: 'تم تأكيد تحويل المبلغ وشطب الصندوق بنجاح! 🎉', completedBox });
  } catch (err) {
    console.error('Confirm transfer error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء تأكيد التحويل' });
  }
});

// Toggle Box Status (Direct click on box grid)
app.post('/api/challenge/toggle-box', authenticateToken, (req, res) => {
  try {
    const { boxId } = req.body;
    const box = db.prepare('SELECT * FROM boxes WHERE id = ?').get(boxId);
    if (!box) {
      return res.status(404).json({ error: 'الصندوق غير موجود' });
    }

    const newStatus = box.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

    db.prepare('UPDATE boxes SET status = ?, completed_at = ? WHERE id = ?').run(newStatus, completedAt, boxId);

    // If toggling off the currently pending box, clear pending_box_id
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(box.challenge_id);
    if (challenge && challenge.pending_box_id === boxId) {
      db.prepare('UPDATE challenges SET pending_box_id = NULL WHERE id = ?').run(challenge.id);
    }

    return res.json({ message: 'تم تحديث حالة الصندوق بنجاح', boxId, newStatus });
  } catch (err) {
    return res.status(500).json({ error: 'حدث خطأ أثناء تحديث حالة الصندوق' });
  }
});

// Catch-all for React SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 خادم صندوق التوفير يعمل بنجاح على: http://0.0.0.0:${PORT}`);
  console.log(`📡 يمكنك الوصول إليه في الشبكة المحلية عبر عنوان IP الخاص بك على المنفذ ${PORT}`);
});
