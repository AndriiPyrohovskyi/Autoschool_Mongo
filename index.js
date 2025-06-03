require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('API: Підключено до MongoDB Atlas'))
  .catch(err => console.error('API: Помилка підключення до БД:', err));

// Імпорт моделей
const Student = require('./src/models/student');
const Instructor = require('./src/models/instructor');
const Lesson = require('./src/models/lesson');
const Payment = require('./src/models/payment');

// API для студентів
app.get('/api/students', async (req, res) => {
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
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Студента не знайдено' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ error: 'Студента не знайдено' });
    res.json(student);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Студента не знайдено' });
    res.json({ message: 'Студента видалено' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Аналітичні API endpoints
app.get('/api/analytics/students-by-status', async (req, res) => {
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

app.get('/api/analytics/average-payment', async (req, res) => {
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

app.get('/api/analytics/payment-extremes', async (req, res) => {
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

app.get('/api/analytics/payments-by-method', async (req, res) => {
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

// Додайте ці endpoint'и до index.js після існуючих:

// Комбінований пайплайн з join
app.get('/api/analytics/complex-pipeline', async (req, res) => {
  try {
    const stats = await Student.aggregate([
      // Фільтрація - тільки активні студенти
      {
        $match: { status: 'active' }
      },
      // Join з платежами
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'student',
          as: 'payments'
        }
      },
      // Join з заняттями
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'student',
          as: 'lessons'
        }
      },
      // Групування за категорією
      {
        $group: {
          _id: '$category',
          studentCount: { $sum: 1 },
          totalPayments: { $sum: { $size: '$payments' } },
          totalLessons: { $sum: { $size: '$lessons' } },
          avgPayments: { $avg: { $size: '$payments' } },
          maxPayments: { $max: { $size: '$payments' } },
          minPayments: { $min: { $size: '$payments' } }
        }
      },
      // Сортування за кількістю студентів
      {
        $sort: { studentCount: -1 }
      },
      // Обмеження результатів
      {
        $limit: 10
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join: Студенти з їх платежами
app.get('/api/analytics/students-with-payments', async (req, res) => {
  try {
    const students = await Student.aggregate([
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'student',
          as: 'payments'
        }
      },
      {
        $addFields: {
          totalPayments: { $sum: '$payments.amount' },
          paymentCount: { $size: '$payments' }
        }
      },
      {
        $sort: { totalPayments: -1 }
      },
      {
        $limit: 20
      }
    ]);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join: Інструктори з їх заняттями та студентами
app.get('/api/analytics/instructors-with-lessons', async (req, res) => {
  try {
    const instructors = await Instructor.aggregate([
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'instructor',
          as: 'lessons'
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'lessons.student',
          foreignField: '_id',
          as: 'students'
        }
      },
      {
        $addFields: {
          lessonCount: { $size: '$lessons' },
          uniqueStudents: { $size: '$students' }
        }
      },
      {
        $sort: { lessonCount: -1 }
      }
    ]);
    res.json(instructors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Аналітика платежів по місяцях
app.get('/api/analytics/payments-by-month', async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тести індексів
app.get('/api/test/no-index', async (req, res) => {
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

app.get('/api/test/with-index', async (req, res) => {
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

// Статистика
app.get('/api/stats', async (req, res) => {
  try {
    // Перевіряємо з'єднання з БД
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'Не підключено до БД' });
    }

    const [students, instructors, lessons, payments] = await Promise.allSettled([
      Student.countDocuments(),
      Instructor.countDocuments(),
      Lesson.countDocuments(),
      Payment.countDocuments()
    ]);

    const stats = {
      students: students.status === 'fulfilled' ? students.value : 0,
      instructors: instructors.status === 'fulfilled' ? instructors.value : 0,
      lessons: lessons.status === 'fulfilled' ? lessons.value : 0,
      payments: payments.status === 'fulfilled' ? payments.value : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Помилка в /api/stats:', error);
    res.status(500).json({ 
      error: error.message,
      stats: { students: 0, instructors: 0, lessons: 0, payments: 0 }
    });
  }
});

// Базовий роут
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Системи автошколи',
    endpoints: {
      students: '/api/students',
      instructors: '/api/instructors', 
      lessons: '/api/lessons',
      payments: '/api/payments',
      stats: '/api/stats',
      analytics: '/api/analytics/*',
      tests: '/api/test/*'
    }
  });
});

// Видалення індексів для чистого тесту
app.get('/api/test/drop-indexes', async (req, res) => {
  try {
    // Отримуємо список всіх індексів
    const indexes = await Student.collection.listIndexes().toArray();
    const indexNames = indexes
      .filter(index => index.name !== '_id_') // Не видаляємо _id індекс
      .map(index => index.name);
    
    // Видаляємо кожен індекс окремо
    for (const indexName of indexNames) {
      try {
        await Student.collection.dropIndex(indexName);
      } catch (err) {
        console.log(`Не вдалося видалити індекс ${indexName}:`, err.message);
      }
    }
    
    res.json({ 
      message: `Видалено ${indexNames.length} індексів (крім _id)`,
      deletedIndexes: indexNames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Інформація про індекси
app.get('/api/test/indexes-info', async (req, res) => {
  try {
    const indexes = await Student.collection.listIndexes().toArray();
    res.json({
      indexes: indexes.map(index => ({
        name: index.name,
        key: index.key,
        unique: index.unique || false
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест пошуку по email без індексу
app.get('/api/test/email-no-index', async (req, res) => {
  try {
    const searchTerm = req.query.term || 'gmail.com';
    
    // Спочатку видаляємо індекс на email якщо він є
    try {
      await Student.collection.dropIndex('email_1');
    } catch (err) {
      // Індекс не існував, це нормально
    }
    
    const startTime = Date.now();
    const results = await Student.find({ 
      email: { $regex: searchTerm, $options: 'i' } 
    }).limit(100);
    const endTime = Date.now();
    
    res.json({
      test: 'Email search without index',
      searchTerm,
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест пошуку по email з індексом
app.get('/api/test/email-with-index', async (req, res) => {
  try {
    const searchTerm = req.query.term || 'gmail.com';
    
    // Створюємо індекс
    await Student.collection.createIndex({ email: 1 });
    
    // Невелика затримка для створення індексу
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const startTime = Date.now();
    const results = await Student.find({ 
      email: { $regex: searchTerm, $options: 'i' } 
    }).limit(100);
    const endTime = Date.now();
    
    res.json({
      test: 'Email search with index',
      searchTerm,
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест пошуку по firstName без індексу
app.get('/api/test/name-no-index', async (req, res) => {
  try {
    const searchTerm = req.query.term || 'Олекс';
    
    // Видаляємо індекс якщо є
    try {
      await Student.collection.dropIndex('firstName_1');
    } catch (err) {
      // Індекс не існував
    }
    
    const startTime = Date.now();
    const results = await Student.find({ 
      firstName: { $regex: searchTerm, $options: 'i' } 
    }).limit(100);
    const endTime = Date.now();
    
    res.json({
      test: 'Name search without index',
      searchTerm,
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест пошуку по firstName з індексом
app.get('/api/test/name-with-index', async (req, res) => {
  try {
    const searchTerm = req.query.term || 'Олекс';
    
    // Створюємо індекс
    await Student.collection.createIndex({ firstName: 1 });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const startTime = Date.now();
    const results = await Student.find({ 
      firstName: { $regex: searchTerm, $options: 'i' } 
    }).limit(100);
    const endTime = Date.now();
    
    res.json({
      test: 'Name search with index',
      searchTerm,
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест складного пошуку без індексу
app.get('/api/test/complex-no-index', async (req, res) => {
  try {
    // Видаляємо композитний індекс якщо є
    try {
      await Student.collection.dropIndex('status_1_category_1_firstName_1');
    } catch (err) {
      // Індекс не існував
    }
    
    const startTime = Date.now();
    const results = await Student.find({ 
      $and: [
        { status: 'active' },
        { category: 'B' },
        { firstName: { $regex: '^А', $options: 'i' } }
      ]
    }).limit(50);
    const endTime = Date.now();
    
    res.json({
      test: 'Complex search without index',
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Тест складного пошуку з композитним індексом
app.get('/api/test/complex-with-index', async (req, res) => {
  try {
    // Створюємо композитний індекс
    await Student.collection.createIndex({ 
      status: 1, 
      category: 1, 
      firstName: 1 
    });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const startTime = Date.now();
    const results = await Student.find({ 
      $and: [
        { status: 'active' },
        { category: 'B' },
        { firstName: { $regex: '^А', $options: 'i' } }
      ]
    }).limit(50);
    const endTime = Date.now();
    
    res.json({
      test: 'Complex search with composite index',
      executionTime: endTime - startTime,
      resultCount: results.length,
      hasIndex: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Порівняльний тест сортування
app.get('/api/test/sort-comparison', async (req, res) => {
  try {
    // Видаляємо індекс для сортування
    try {
      await Student.collection.dropIndex('lastName_1_firstName_1');
    } catch (err) {
      // Індекс не існував
    }
    
    // Тест без індексу
    const startTime1 = Date.now();
    await Student.find({}).sort({ lastName: 1, firstName: 1 }).limit(100);
    const endTime1 = Date.now();
    const withoutIndex = endTime1 - startTime1;
    
    // Створюємо індекс для сортування
    await Student.collection.createIndex({ lastName: 1, firstName: 1 });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Тест з індексом
    const startTime2 = Date.now();
    await Student.find({}).sort({ lastName: 1, firstName: 1 }).limit(100);
    const endTime2 = Date.now();
    const withIndex = endTime2 - startTime2;
    
    const improvement = withoutIndex > 0 && withIndex > 0 ? 
      (withoutIndex / withIndex).toFixed(2) : '1.00';
    
    res.json({
      test: 'Sort performance comparison',
      results: {
        withoutIndex,
        withIndex
      },
      improvement: `${improvement}x швидше`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API сервер запущено на порті ${PORT}`);
});