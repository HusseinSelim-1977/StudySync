require('dotenv').config({ path: '../../.env' });
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const path = require('path');
const { createProducer, TOPICS, formatMessage } = require(path.resolve(__dirname, '../../../shared/kafka'));

const app = express();
app.use(express.json());
const prisma = new PrismaClient();

const PORT = process.env.AVAILABILITY_SERVICE_PORT || 4003;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

let kafkaProducer;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Token invalid or expired' });
    req.user = user;
    next();
  });
};

const checkOverlap = (existingSlots, newStart, newEnd, excludeId = null) => {
  const startToMinutes = (time) => parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  const newSt = startToMinutes(newStart);
  const newEn = startToMinutes(newEnd);

  return existingSlots.some(slot => {
    if (slot.id === excludeId) return false;
    const st = startToMinutes(slot.startTime);
    const en = startToMinutes(slot.endTime);
    // Overlap condition: starts before existing ends AND ends after existing starts
    return newSt < en && newEn > st;
  });
};

const publishUpdate = async (userId) => {
  const slots = await prisma.availability.findMany({ where: { userId } });
  try {
    const msg = formatMessage(TOPICS.AVAILABILITY_UPDATED, 'availability-service', { userId, slots });
    await kafkaProducer.send({
      topic: TOPICS.AVAILABILITY_UPDATED,
      messages: [{ value: JSON.stringify(msg) }]
    });
  } catch (kafkaErr) {
    console.error('Failed to dispatch AVAILABILITY_UPDATED', kafkaErr);
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'availability-service', timestamp: new Date().toISOString() });
});

app.get('/availability/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const slots = await prisma.availability.findMany({ where: { userId } });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/availability', authenticateToken, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    const userId = req.user.id;

    if (startTime >= endTime) return res.status(400).json({ error: 'start time must be before end time' });

    const existingSlots = await prisma.availability.findMany({ where: { userId, dayOfWeek } });
    if (checkOverlap(existingSlots, startTime, endTime)) {
      return res.status(409).json({ error: 'Time slot overlaps with an existing slot' });
    }

    const slot = await prisma.availability.create({
      data: { userId, dayOfWeek, startTime, endTime }
    });

    await publishUpdate(userId);
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/availability/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;
    const userId = req.user.id;

    if (startTime >= endTime) return res.status(400).json({ error: 'start time must be before end time' });

    const slotRef = await prisma.availability.findUnique({ where: { id } });
    if (!slotRef || slotRef.userId !== userId) return res.status(403).json({ error: 'Forbidden or Not found' });

    const existingSlots = await prisma.availability.findMany({ where: { userId, dayOfWeek } });
    if (checkOverlap(existingSlots, startTime, endTime, id)) {
      return res.status(409).json({ error: 'Time slot overlaps with an existing slot' });
    }

    const slot = await prisma.availability.update({
      where: { id },
      data: { dayOfWeek, startTime, endTime }
    });

    await publishUpdate(userId);
    res.json(slot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/availability/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const slotRef = await prisma.availability.findUnique({ where: { id } });
    if (!slotRef) return res.status(404).json({ error: 'Not found' });
    if (slotRef.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.availability.delete({ where: { id } });
    
    await publishUpdate(userId);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const startServer = async () => {
  try {
    kafkaProducer = createProducer('availability-service');
    await kafkaProducer.connect();
    app.listen(PORT, () => console.log(`Availability Service listening on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  if (kafkaProducer) await kafkaProducer.disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  if (kafkaProducer) await kafkaProducer.disconnect();
  process.exit(0);
});
