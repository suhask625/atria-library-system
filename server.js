const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Suhask@123', // CHANGE THIS to your MySQL password
  database: 'atria_library',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Connection Error:', err.message);
    console.error('Please check your MySQL password in server.js');
  });

// Helper function
function calculateFine(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today - due;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 5 : 0;
}

// Authentication Routes
app.post('/api/login/student', async (req, res) => {
  try {
    const { usn, password } = req.body;
    const [students] = await pool.execute(
      'SELECT * FROM students WHERE usn = ? AND password = ?',
      [usn, password]
    );
    
    if (students.length > 0) {
      const { password, ...studentData } = students[0];
      res.json({ success: true, user: studentData, role: 'student' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid USN or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/login/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [admins] = await pool.execute(
      'SELECT * FROM admins WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (admins.length > 0) {
      const { password, ...adminData } = admins[0];
      res.json({ success: true, user: adminData, role: 'admin' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Books API
app.get('/api/books', async (req, res) => {
  try {
    const [books] = await pool.execute('SELECT * FROM books ORDER BY id DESC');
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, isbn, publisher, category, copies } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO books (title, author, isbn, publisher, category, copies, available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, author, isbn, publisher, category, copies, copies]
    );
    
    const [newBook] = await pool.execute('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.json({ success: true, book: newBook[0] });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, publisher, category, copies } = req.body;
    
    await pool.execute(
      'UPDATE books SET title=?, author=?, isbn=?, publisher=?, category=?, copies=? WHERE id=?',
      [title, author, isbn, publisher, category, copies, id]
    );
    
    const [updatedBook] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
    res.json({ success: true, book: updatedBook[0] });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM books WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Students API
app.get('/api/students', async (req, res) => {
  try {
    const [students] = await pool.execute('SELECT id, name, usn, department, semester, email, phone FROM students ORDER BY id DESC');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, usn, department, semester, email, phone } = req.body;
    const password = 'student123'; // Default password
    
    const [result] = await pool.execute(
      'INSERT INTO students (name, usn, department, semester, email, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, usn, department, semester, email, phone, password]
    );
    
    const [newStudent] = await pool.execute(
      'SELECT id, name, usn, department, semester, email, phone FROM students WHERE id = ?',
      [result.insertId]
    );
    res.json({ success: true, student: newStudent[0] });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [students] = await pool.execute(
      'SELECT id, name, usn, department, semester, email, phone FROM students WHERE id = ?',
      [id]
    );
    
    if (students.length > 0) {
      res.json(students[0]);
    } else {
      res.status(404).json({ success: false, message: 'Student not found' });
    }
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Transactions API
app.get('/api/transactions', async (req, res) => {
  try {
    const [transactions] = await pool.execute('SELECT * FROM transactions ORDER BY id DESC');
    
    const txWithFines = transactions.map(tx => ({
      ...tx,
      fine: tx.status === 'issued' ? calculateFine(tx.due_date) : tx.fine
    }));
    
    res.json(txWithFines);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/transactions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE student_id = ? ORDER BY id DESC',
      [studentId]
    );
    
    const txWithFines = transactions.map(tx => ({
      id: tx.id,
      studentId: tx.student_id,
      bookId: tx.book_id,
      studentName: tx.student_name,
      bookTitle: tx.book_title,
      issueDate: tx.issue_date,
      dueDate: tx.due_date,
      returnDate: tx.return_date,
      status: tx.status,
      fine: tx.status === 'issued' ? calculateFine(tx.due_date) : tx.fine
    }));
    
    res.json(txWithFines);
  } catch (error) {
    console.error('Error fetching student transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/transactions/issue', async (req, res) => {
  try {
    const { studentId, bookId } = req.body;
    
    // Get student and book details
    const [students] = await pool.execute('SELECT * FROM students WHERE id = ?', [studentId]);
    const [books] = await pool.execute('SELECT * FROM books WHERE id = ?', [bookId]);
    
    if (students.length === 0 || books.length === 0) {
      return res.status(404).json({ success: false, message: 'Student or book not found' });
    }
    
    const student = students[0];
    const book = books[0];
    
    if (book.available <= 0) {
      return res.status(400).json({ success: false, message: 'Book not available' });
    }
    
    const issueDate = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // Insert transaction
    const [result] = await pool.execute(
      'INSERT INTO transactions (student_id, book_id, student_name, book_title, issue_date, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [studentId, bookId, student.name, book.title, issueDate, dueDateStr, 'issued']
    );
    
    // Update book availability
    await pool.execute('UPDATE books SET available = available - 1 WHERE id = ?', [bookId]);
    
    const [newTransaction] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    res.json({ success: true, transaction: newTransaction[0] });
  } catch (error) {
    console.error('Error issuing book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/transactions/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [transactions] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    
    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const transaction = transactions[0];
    
    if (transaction.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book already returned' });
    }
    
    const returnDate = new Date().toISOString().split('T')[0];
    const fine = calculateFine(transaction.due_date);
    
    // Update transaction
    await pool.execute(
      'UPDATE transactions SET return_date = ?, status = ?, fine = ? WHERE id = ?',
      [returnDate, 'returned', fine, id]
    );
    
    // Update book availability
    await pool.execute('UPDATE books SET available = available + 1 WHERE id = ?', [transaction.book_id]);
    
    const [updatedTransaction] = await pool.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json({ success: true, transaction: updatedTransaction[0], fine });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    const [bookStats] = await pool.execute('SELECT SUM(copies) as total, SUM(available) as available FROM books');
    const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students');
    const [issuedCount] = await pool.execute('SELECT COUNT(*) as count FROM transactions WHERE status = "issued"');
    const [transactions] = await pool.execute('SELECT * FROM transactions WHERE status = "issued"');
    
    const overdueBooks = transactions.filter(t => new Date(t.due_date) < new Date()).length;
    
    res.json({
      totalBooks: bookStats[0].total || 0,
      availableBooks: bookStats[0].available || 0,
      issuedBooks: issuedCount[0].count || 0,
      overdueBooks: overdueBooks,
      totalStudents: studentCount[0].count || 0,
      totalTransactions: transactions.length
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'student.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`✅ Server is running!`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`🗄️  Database: MySQL (atria_library)`);
  console.log('=================================');
  console.log('Login Credentials:');
  console.log('📘 Admin: username=admin, password=admin123');
  console.log('👨‍🎓 Student: usn=1AT20CS001, password=student123');
  console.log('=================================');
});