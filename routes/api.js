const express = require('express');
const router = express.Router();
const Student = require('../src/models/student');
const Instructor = require('../src/models/instructor');
const Lesson = require('../src/models/lesson');
const Payment = require('../src/models/payment');

// 1. Підрахунок документів за умовами
router.get('/stats/students-by-status', async (req, res) => {
  try {
    const stats = await Student.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Середнє значення для числових полів
router.get('/stats/average-payment', async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          averageAmount: { $avg: '$amount' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats[0] || { averageAmount: 0, totalAmount: 0, count: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Найменші/найбільші значення
router.get('/stats/payment-extremes', async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          minPayment: { $min: '$amount' },
          maxPayment: { $max: '$amount' }
        }
      }
    ]);
    res.json(stats[0] || { minPayment: 0, maxPayment: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Підсумовування значень у групах
router.get('/stats/payments-by-method', async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Комбінований пайплайн
router.get('/stats/complex-analysis', async (req, res) => {
  try {
    const stats = await Student.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'student',
          as: 'payments'
        }
      },
      {
        $group: {
          _id: '$category',
          studentCount: { $sum: 1 },
          totalPayments: { $sum: { $size: '$payments' } },
          avgPayments: { $avg: { $size: '$payments' } }
        }
      },
      {
        $sort: { studentCount: -1 }
      },
      {
        $limit: 10
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест швидкості без індексу
router.get('/test/no-index', async (req, res) => {
  try {
    const startTime = Date.now();
    const results = await Student.find({ 
      email: { $regex: 'gmail.com', $options: 'i' } 
    }).limit(100);
    const endTime = Date.now();
    
    res.json({
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест швидкості з індексом
router.get('/test/with-index', async (req, res) => {
  try {
    await Student.collection.createIndex({ email: 1 });
    
    const startTime = Date.now();
    const results = await Student.find({ 
      email: { $regex: 'gmail.com', $options: 'i' } 
    }).limit(100);
    const endTime = Date.now();
    
    res.json({
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;