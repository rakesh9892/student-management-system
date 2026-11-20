
-- Student Management System Database Setup
-- Create a database named student_management first.
-- Connect to student_management before running this script.

-- Sequence for auto-generated admission numbers
CREATE SEQUENCE admission_num_seq START 1;

-- Students table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,

    admission_number VARCHAR(20) UNIQUE NOT NULL
        DEFAULT (
            'ADM-2026-' ||
            LPAD(nextval('admission_num_seq')::TEXT, 4, '0')
        ),

    name VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
    dob DATE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    gender VARCHAR(20) NOT NULL
        CHECK (gender IN ('Male', 'Female', 'Other')),
    address TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
