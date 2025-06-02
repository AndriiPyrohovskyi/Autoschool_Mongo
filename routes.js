const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Отримати всіх студентів
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
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

module.exports = router;