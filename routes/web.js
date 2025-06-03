const express = require('express');
const router = express.Router();
const Student = require('../src/models/student');
const Instructor = require('../src/models/instructor');
const Lesson = require('../src/models/lesson');
const Payment = require('../src/models/payment');

// Головна сторінка
router.get('/', async (req, res) => {
  try {
    const stats = {
      students: await Student.countDocuments(),
      instructors: await Instructor.countDocuments(),
      lessons: await Lesson.countDocuments(),
      payments: await Payment.countDocuments()
    };
    res.render('index', { stats });
  } catch (error) {
    res.render('error', { error: error.message });
  }
});

// Студенти - список з пошуком та пагінацією
router.get('/students', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'firstName';
    const sortOrder = req.query.sortOrder || 'asc';
    const category = req.query.category || '';
    const status = req.query.status || '';

    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const students = await Student.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.render('students/index', {
      students,
      currentPage: page,
      totalPages,
      search,
      sortBy,
      sortOrder,
      category,
      status,
      limit
    });
  } catch (error) {
    res.render('error', { error: error.message });
  }
});

// Форма додавання студента
router.get('/students/new', (req, res) => {
  res.render('students/new', { student: {}, error: null });
});

// Додавання студента
router.post('/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.redirect('/students');
  } catch (error) {
    res.render('students/new', { error: error.message, student: req.body });
  }
});

// Перегляд студента
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.render('error', { error: 'Студента не знайдено' });
    }
    res.render('students/show', { student });
  } catch (error) {
    res.render('error', { error: error.message });
  }
});

// Форма редагування студента
router.get('/students/:id/edit', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.render('error', { error: 'Студента не знайдено' });
    }
    res.render('students/edit', { student, error: null });
  } catch (error) {
    res.render('error', { error: error.message });
  }
});

// Оновлення студента
router.post('/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/students/' + req.params.id);
  } catch (error) {
    const student = await Student.findById(req.params.id);
    res.render('students/edit', { student, error: error.message });
  }
});

// Видалення студента
router.post('/students/:id/delete', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.redirect('/students');
  } catch (error) {
    res.render('error', { error: error.message });
  }
});

// Сторінка аналітики
router.get('/analytics', (req, res) => {
  res.render('analytics');
});

// Сторінка індексів
router.get('/indexes', (req, res) => {
  res.render('indexes');
});

module.exports = router;