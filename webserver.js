require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Налаштування axios з таймаутом
axios.defaults.timeout = 10000; // 10 секунд

// Головна сторінка
app.get('/', async (req, res) => {
  try {
    console.log('Завантаження головної сторінки...');
    console.log('API URL:', API_URL);
    
    const statsResponse = await axios.get(`${API_URL}/api/stats`);
    console.log('Отримано статистику:', statsResponse.data);
    
    const stats = statsResponse.data;
    res.render('index', { stats });
  } catch (error) {
    console.error('Помилка отримання статистики:', error.message);
    
    // Показуємо нульову статистику замість помилки
    const stats = { students: 0, instructors: 0, lessons: 0, payments: 0 };
    res.render('index', { stats });
  }
});

// Список студентів
app.get('/students', async (req, res) => {
  try {
    console.log('Завантаження списку студентів...');
    const params = new URLSearchParams(req.query);
    console.log('Параметри запиту:', params.toString());
    
    const response = await axios.get(`${API_URL}/api/students?${params}`);
    console.log('Отримано студентів:', response.data.students?.length || 0);
    
    res.render('students/index', {
      students: response.data.students || [],
      currentPage: response.data.currentPage || 1,
      totalPages: response.data.totalPages || 1,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'firstName',
      sortOrder: req.query.sortOrder || 'asc',
      category: req.query.category || '',
      status: req.query.status || '',
      limit: req.query.limit || 10
    });
  } catch (error) {
    console.error('Помилка завантаження студентів:', error.message);
    
    // Показуємо порожній список замість помилки
    res.render('students/index', {
      students: [],
      currentPage: 1,
      totalPages: 1,
      search: req.query.search || '',
      sortBy: req.query.sortBy || 'firstName',
      sortOrder: req.query.sortOrder || 'asc',
      category: req.query.category || '',
      status: req.query.status || '',
      limit: req.query.limit || 10
    });
  }
});

// Форма додавання
app.get('/students/new', (req, res) => {
  res.render('students/new', { student: {}, error: null });
});

// Додавання студента
app.post('/students', async (req, res) => {
  try {
    await axios.post(`${API_URL}/api/students`, req.body);
    res.redirect('/students');
  } catch (error) {
    console.error('Помилка додавання студента:', error.message);
    res.render('students/new', { 
      error: 'Помилка додавання студента: ' + error.message, 
      student: req.body 
    });
  }
});

// Перегляд студента
app.get('/students/:id', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/students/${req.params.id}`);
    res.render('students/show', { student: response.data });
  } catch (error) {
    console.error('Помилка завантаження студента:', error.message);
    res.render('error', { error: 'Студента не знайдено' });
  }
});

// Форма редагування
app.get('/students/:id/edit', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/students/${req.params.id}`);
    res.render('students/edit', { student: response.data, error: null });
  } catch (error) {
    console.error('Помилка завантаження для редагування:', error.message);
    res.render('error', { error: 'Студента не знайдено' });
  }
});

// Оновлення студента
app.post('/students/:id', async (req, res) => {
  try {
    await axios.put(`${API_URL}/api/students/${req.params.id}`, req.body);
    res.redirect(`/students/${req.params.id}`);
  } catch (error) {
    console.error('Помилка оновлення студента:', error.message);
    res.render('students/edit', { 
      student: req.body, 
      error: 'Помилка оновлення студента: ' + error.message
    });
  }
});

// Видалення студента
app.post('/students/:id/delete', async (req, res) => {
  try {
    await axios.delete(`${API_URL}/api/students/${req.params.id}`);
    res.redirect('/students');
  } catch (error) {
    console.error('Помилка видалення студента:', error.message);
    res.render('error', { error: 'Помилка видалення студента' });
  }
});

// Аналітика
app.get('/analytics', (req, res) => {
  res.render('analytics');
});

// Індекси
app.get('/indexes', (req, res) => {
  res.render('indexes');
});

// Тест API підключення
app.get('/test-api', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/`);
    res.json({ 
      status: 'OK', 
      api_response: response.data,
      api_url: API_URL
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message,
      api_url: API_URL
    });
  }
});

const PORT = process.env.WEB_PORT;
app.listen(PORT, () => {
  console.log(`Веб-сервер запущено на http://localhost:${PORT}`);
  console.log(`Використовує API: ${API_URL}`);
});