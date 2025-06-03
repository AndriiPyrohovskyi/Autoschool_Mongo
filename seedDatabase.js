require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Імпорт моделей
const Student = require('./src/models/student');
const Instructor = require('./src/models/instructor');
const Lesson = require('./src/models/lesson');
const Payment = require('./src/models/payment');

// Налаштування кількості записів
const COUNTS = {
  students: 500,
  instructors: 10,
  lessons: 1000,
  payments: 1000
};

// Підключення до БД
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Підключено до MongoDB Atlas'))
  .catch(err => console.error('Помилка підключення до БД:', err));

// Функція для створення фейкових студентів
async function createStudents(count) {
  console.log(`Створення ${count} студентів...`);
  const students = [];
  
  for (let i = 0; i < count; i++) {
    const student = new Student({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+380#########'),
      dateOfBirth: faker.date.between({ from: '1980-01-01', to: '2005-12-31' }),
      enrollmentDate: faker.date.between({ from: '2023-01-01', to: new Date() }),
      category: faker.helpers.arrayElement(['A', 'B', 'C', 'D']),
      status: faker.helpers.arrayElement(['active', 'completed', 'suspended'])
    });
    
    students.push(student);
  }
  
  await Student.insertMany(students);
  console.log('✅ Студенти створені');
  return students;
}

// Функція для створення фейкових інструкторів
async function createInstructors(count) {
  console.log(`Створення ${count} інструкторів...`);
  const instructors = [];
  
  for (let i = 0; i < count; i++) {
    const instructor = new Instructor({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+380#########'),
      licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
      categories: faker.helpers.arrayElements(['A', 'B', 'C', 'D'], { min: 1, max: 3 }),
      hourlyRate: faker.number.int({ min: 300, max: 800 })
    });
    
    instructors.push(instructor);
  }
  
  await Instructor.insertMany(instructors);
  console.log('✅ Інструктори створені');
  return instructors;
}

// Функція для створення фейкових занять
async function createLessons(count, students, instructors) {
  console.log(`Створення ${count} занять...`);
  const lessons = [];
  
  for (let i = 0; i < count; i++) {
    const lesson = new Lesson({
      student: faker.helpers.arrayElement(students)._id,
      instructor: faker.helpers.arrayElement(instructors)._id,
      date: faker.date.between({ from: '2024-01-01', to: '2024-12-31' }),
      duration: faker.helpers.arrayElement([45, 60, 90, 120]),
      type: faker.helpers.arrayElement(['theory', 'practice']),
      status: faker.helpers.arrayElement(['scheduled', 'completed', 'cancelled']),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 })
    });
    
    lessons.push(lesson);
  }
  
  await Lesson.insertMany(lessons);
  console.log('✅ Заняття створені');
  return lessons;
}

// Функція для створення фейкових платежів
async function createPayments(count, students) {
  console.log(`Створення ${count} платежів...`);
  const payments = [];
  
  const paymentDescriptions = [
    'Оплата за теоретичний курс',
    'Оплата за практичні заняття',
    'Оплата за екзамен',
    'Доплата за додаткові заняття',
    'Оплата за медогляд',
    'Оплата за документи'
  ];
  
  for (let i = 0; i < count; i++) {
    const payment = new Payment({
      student: faker.helpers.arrayElement(students)._id,
      amount: faker.number.int({ min: 500, max: 5000 }),
      paymentDate: faker.date.between({ from: '2024-01-01', to: new Date() }),
      paymentMethod: faker.helpers.arrayElement(['cash', 'card', 'transfer']),
      description: faker.helpers.arrayElement(paymentDescriptions),
      status: faker.helpers.arrayElement(['pending', 'completed', 'failed'])
    });
    
    payments.push(payment);
  }
  
  await Payment.insertMany(payments);
  console.log('✅ Платежі створені');
  return payments;
}

// Головна функція
async function seedDatabase() {
  try {
    console.log('🚀 Початок заповнення БД...\n');
    
    // Очищення існуючих даних
    console.log('Очищення існуючих даних...');
    await Student.deleteMany({});
    await Instructor.deleteMany({});
    await Lesson.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Дані очищені\n');
    
    // Створення даних
    const students = await createStudents(COUNTS.students);
    const instructors = await createInstructors(COUNTS.instructors);
    const lessons = await createLessons(COUNTS.lessons, students, instructors);
    const payments = await createPayments(COUNTS.payments, students);
    
    console.log('\n🎉 БД успішно заповнена!');
    console.log(`📊 Створено:`);
    console.log(`   👨‍🎓 Студентів: ${COUNTS.students}`);
    console.log(`   👨‍🏫 Інструкторів: ${COUNTS.instructors}`);
    console.log(`   📚 Занять: ${COUNTS.lessons}`);
    console.log(`   💰 Платежів: ${COUNTS.payments}`);
    
  } catch (error) {
    console.error('❌ Помилка заповнення БД:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Запуск скрипта
seedDatabase();