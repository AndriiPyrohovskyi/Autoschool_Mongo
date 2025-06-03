const express = require('express');
const router = express.Router();
const Student = require('../src/models/student');
const Instructor = require('../src/models/instructor');
const Lesson = require('../src/models/lesson');
const Payment = require('../src/models/payment');

// Отримати всіх студентів з пагінацією та фільтрами
router.get('/', async (req, res) => {
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

    res.json({
      students,
      currentPage: page,
      totalPages,
      total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отримати студента за ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Студента не знайдено' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Створити нового студента
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Оновити студента
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ error: 'Студента не знайдено' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Видалити студента
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Студента не знайдено' });
    res.json({ message: 'Студента видалено' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Статистика
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      students: await Student.countDocuments(),
      instructors: await Instructor.countDocuments(), 
      lessons: await Lesson.countDocuments(),
      payments: await Payment.countDocuments()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;