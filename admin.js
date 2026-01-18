// Check authentication
const user = JSON.parse(localStorage.getItem('user'));
const role = localStorage.getItem('role');

if (!user || role !== 'admin') {
    window.location.href = '/';
}

// Display admin name
document.getElementById('adminName').textContent = `Welcome, ${user.name}`;

let allBooks = [];
let allStudents = [];
let allTransactions = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadBooks();
    loadStudents();
    loadTransactions();
});

// Logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = '/';
}

// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab).classList.add('active');
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        document.getElementById('totalBooks').textContent = stats.totalBooks;
        document.getElementById('availableBooks').textContent = stats.availableBooks;
        document.getElementById('issuedBooks').textContent = stats.issuedBooks;
        document.getElementById('overdueBooks').textContent = stats.overdueBooks;
        
        loadRecentTransactions();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load Recent Transactions
async function loadRecentTransactions() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        const tbody = document.getElementById('recentTransactions');
        
        const recent = transactions.slice(-5).reverse();
        tbody.innerHTML = recent.map(t => {
            const status = getTransactionStatus(t);
            return `
                <tr>
                    <td>${t.studentName}</td>
                    <td>${t.bookTitle}</td>
                    <td>${t.issueDate}</td>
                    <td>${t.dueDate}</td>
                    <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

// Load Books
async function loadBooks() {
    try {
        const response = await fetch('/api/books');
        allBooks = await response.json();
        renderBooks(allBooks);
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

function renderBooks(books) {
    const tbody = document.getElementById('booksTable');
    tbody.innerHTML = books.map(book => `
        <tr>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.category}</td>
            <td>${book.copies}</td>
            <td>${book.available}</td>
            <td><span class="status-badge ${book.available > 0 ? 'available' : 'unavailable'}">${book.available > 0 ? 'Available' : 'Unavailable'}</span></td>
        </tr>
    `).join('');
}

function searchBooks() {
    const query = document.getElementById('bookSearch').value.toLowerCase();
    const filtered = allBooks.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query)
    );
    renderBooks(filtered);
}

// Load Students
async function loadStudents() {
    try {
        const response = await fetch('/api/students');
        allStudents = await response.json();
        renderStudents(allStudents);
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function renderStudents(students) {
    const tbody = document.getElementById('studentsTable');
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.name}</td>
            <td>${student.usn}</td>
            <td>${student.department}</td>
            <td>${student.semester}</td>
            <td>${student.email}</td>
            <td>${student.phone}</td>
        </tr>
    `).join('');
}

function searchStudents() {
    const query = document.getElementById('studentSearch').value.toLowerCase();
    const filtered = allStudents.filter(student =>
        student.name.toLowerCase().includes(query) ||
        student.usn.toLowerCase().includes(query)
    );
    renderStudents(filtered);
}

// Load Transactions
async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        allTransactions = await response.json();
        renderTransactions(allTransactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactionsTable');
    tbody.innerHTML = transactions.map(t => {
        const status = getTransactionStatus(t);
        return `
            <tr>
                <td>${t.studentName}</td>
                <td>${t.bookTitle}</td>
                <td>${t.issueDate}</td>
                <td>${t.dueDate}</td>
                <td>${t.returnDate || '-'}</td>
                <td>₹${t.fine}</td>
                <td><span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                <td>
                    ${t.status === 'issued' ? `<button class="action-btn return" onclick="returnBook(${t.id})">Return</button>` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function getTransactionStatus(transaction) {
    if (transaction.status === 'returned') return 'returned';
    const dueDate = new Date(transaction.dueDate);
    const today = new Date();
    return dueDate < today ? 'overdue' : 'issued';
}

// Modal Functions
function openModal(type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modal.classList.add('active');
    
    if (type === 'addBook') {
        modalTitle.textContent = 'Add New Book';
        modalBody.innerHTML = `
            <form onsubmit="addBook(event)">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="bookTitle" required>
                </div>
                <div class="form-group">
                    <label>Author</label>
                    <input type="text" id="bookAuthor" required>
                </div>
                <div class="form-group">
                    <label>ISBN</label>
                    <input type="text" id="bookISBN" required>
                </div>
                <div class="form-group">
                    <label>Publisher</label>
                    <input type="text" id="bookPublisher" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <input type="text" id="bookCategory" required>
                </div>
                <div class="form-group">
                    <label>Number of Copies</label>
                    <input type="number" id="bookCopies" min="1" required>
                </div>
                <button type="submit" class="submit-btn">Add Book</button>
            </form>
        `;
    } else if (type === 'addStudent') {
        modalTitle.textContent = 'Add New Student';
        modalBody.innerHTML = `
            <form onsubmit="addStudent(event)">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="studentName" required>
                </div>
                <div class="form-group">
                    <label>USN</label>
                    <input type="text" id="studentUSN" required>
                </div>
                <div class="form-group">
                    <label>Department</label>
                    <select id="studentDept" required>
                        <option value="">Select Department</option>
                        <option value="CSE">Computer Science</option>
                        <option value="ECE">Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                        <option value="EEE">Electrical</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Semester</label>
                    <input type="number" id="studentSem" min="1" max="8" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="studentEmail" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" id="studentPhone" required>
                </div>
                <button type="submit" class="submit-btn">Add Student</button>
            </form>
        `;
    } else if (type === 'issueBook') {
        modalTitle.textContent = 'Issue Book';
        modalBody.innerHTML = `
            <form onsubmit="issueBook(event)">
                <div class="form-group">
                    <label>Select Student</label>
                    <select id="issueStudent" required>
                        <option value="">Select Student</option>
                        ${allStudents.map(s => `<option value="${s.id}">${s.name} (${s.usn})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Select Book</label>
                    <select id="issueBook" required>
                        <option value="">Select Book</option>
                        ${allBooks.filter(b => b.available > 0).map(b => `<option value="${b.id}">${b.title} (Available: ${b.available})</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="submit-btn">Issue Book</button>
            </form>
        `;
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Add Book
async function addBook(event) {
    event.preventDefault();
    
    const bookData = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        isbn: document.getElementById('bookISBN').value,
        publisher: document.getElementById('bookPublisher').value,
        category: document.getElementById('bookCategory').value,
        copies: parseInt(document.getElementById('bookCopies').value)
    };
    
    try {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        
        if (response.ok) {
            alert('Book added successfully!');
            closeModal();
            loadBooks();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error adding book:', error);
        alert('Error adding book');
    }
}

// Add Student
async function addStudent(event) {
    event.preventDefault();
    
    const studentData = {
        name: document.getElementById('studentName').value,
        usn: document.getElementById('studentUSN').value,
        department: document.getElementById('studentDept').value,
        semester: parseInt(document.getElementById('studentSem').value),
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value
    };
    
    try {
        const response = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });
        
        if (response.ok) {
            alert('Student added successfully!');
            closeModal();
            loadStudents();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student');
    }
}

// Issue Book
async function issueBook(event) {
    event.preventDefault();
    
    const issueData = {
        studentId: parseInt(document.getElementById('issueStudent').value),
        bookId: parseInt(document.getElementById('issueBook').value)
    };
    
    try {
        const response = await fetch('/api/transactions/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(issueData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Book issued successfully!');
            closeModal();
            loadBooks();
            loadTransactions();
            loadDashboardStats();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error issuing book:', error);
        alert('Error issuing book');
    }
}

// Return Book
async function returnBook(transactionId) {
    if (!confirm('Are you sure you want to return this book?')) return;
    
    try {
        const response = await fetch(`/api/transactions/return/${transactionId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            if (result.fine > 0) {
                alert(`Book returned successfully! Fine: ₹${result.fine}`);
            } else {
                alert('Book returned successfully!');
            }
            loadBooks();
            loadTransactions();
            loadDashboardStats();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error returning book:', error);
        alert('Error returning book');
    }
}