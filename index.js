require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Підключення до БД
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Підключено до MongoDB Atlas'))
  .catch(err => console.error('Помилка підключення до БД:', err));

// Routes
app.use('/api/students', require('./routes/students'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/payments', require('./routes/payments'));

// Базовий роут
app.get('/', (req, res) => {
  res.json({ message: 'API Системи автошколи' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});