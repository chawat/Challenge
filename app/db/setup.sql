
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS timesheets;


-- Create employees table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,  -- Employee's full name (required)
    phone TEXT,               -- Employee's phone number (optional)
    position TEXT,            -- Employee's job position (optional)
    department TEXT,          -- Employee's department (optional)
    hire_date DATE,           -- Employee's hire date (optional)
    salary REAL,              -- Employee's salary (optional, real number)
    email TEXT UNIQUE NOT NULL, -- Employee's email (required, unique)
    date_of_birth DATE,       -- Employee's date of birth (optional)
    address TEXT,              -- Employee's address (optional)
    photo BLOB,
    document BLOB,
    compliance_status TEXT
);

-- Create timesheets table
CREATE TABLE timesheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT NOT NULL,   -- Store start time as text (ISO 8601 format)
    end_time TEXT NOT NULL,     -- Store end time as text (ISO 8601 format)
    total_hours REAL NOT NULL,  -- Store total hours as a decimal
    employee_id INTEGER NOT NULL, -- Employee ID (required)
    summary TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) -- Foreign key constraint
);


-- SELECT timesheets.id, timesheets.start_time, timesheets.end_time, timesheets.total_hours, timesheets.summary, employees.full_name, employees.email
-- FROM timesheets
-- JOIN employees ON timesheets.employee_id = employees.id;