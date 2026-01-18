-- Create Database
CREATE DATABASE IF NOT EXISTS atria_library;
USE atria_library;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    usn VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(50),
    semester INT,
    email VARCHAR(100),
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books Table
CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(100),
    category VARCHAR(50),
    copies INT DEFAULT 1,
    available INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    book_id INT NOT NULL,
    student_name VARCHAR(100),
    book_title VARCHAR(200),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'issued',
    fine DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Insert Sample Data

-- Insert Admin
INSERT INTO admins (username, password, name, email, role) VALUES
('admin', 'admin123', 'Library Administrator', 'library@atria.edu.in', 'admin'),
('librarian1', 'lib123', 'Ms. Shalini', 'shalini@atria.edu.in', 'librarian');

-- Insert Students
INSERT INTO students (name, usn, department, semester, email, phone, password) VALUES
('Rahul Sharma', '1AT20CS001', 'CSE', 5, 'rahul.sharma@atria.edu.in', '9876543210', 'student123'),
('Priya Kumar', '1AT20EC015', 'ECE', 5, 'priya.kumar@atria.edu.in', '9876543211', 'student123'),
('Amit Patel', '1AT21ME025', 'Mechanical', 4, 'amit.patel@atria.edu.in', '9876543212', 'student123'),
('Sneha Reddy', '1AT20CS045', 'CSE', 5, 'sneha.reddy@atria.edu.in', '9876543213', 'student123');

-- Insert Books
INSERT INTO books (title, author, isbn, publisher, category, copies, available) VALUES
('Data Structures & Algorithms', 'Thomas H. Cormen', '9780262033848', 'MIT Press', 'Computer Science', 5, 3),
('Operating Systems Concepts', 'Abraham Silberschatz', '9781118063330', 'Wiley', 'Computer Science', 4, 2),
('Digital Electronics', 'Morris Mano', '9780132145855', 'Pearson', 'Electronics', 3, 3),
('Artificial Intelligence', 'Stuart Russell', '9780136042594', 'Pearson', 'Computer Science', 4, 4),
('Database Management Systems', 'Raghu Ramakrishnan', '9780072465631', 'McGraw-Hill', 'Computer Science', 5, 3),
('Computer Networks', 'Andrew Tanenbaum', '9780132126953', 'Pearson', 'Computer Science', 3, 2),
('Software Engineering', 'Ian Sommerville', '9780133943030', 'Pearson', 'Computer Science', 4, 4);

-- Insert Sample Transactions
INSERT INTO transactions (student_id, book_id, student_name, book_title, issue_date, due_date, status) VALUES
(1, 1, 'Rahul Sharma', 'Data Structures & Algorithms', '2025-01-10', '2025-01-24', 'issued'),
(2, 2, 'Priya Kumar', 'Operating Systems Concepts', '2025-01-12', '2025-01-26', 'issued');

-- Verify data
SELECT 'Students:' as 'Table', COUNT(*) as 'Count' FROM students
UNION ALL
SELECT 'Books:', COUNT(*) FROM books
UNION ALL
SELECT 'Admins:', COUNT(*) FROM admins
UNION ALL
SELECT 'Transactions:', COUNT(*) FROM transactions;