import express from 'express';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfigPath = path.join(__dirname, '../database.yaml');
const dbConfig = yaml.load(fs.readFileSync(dbConfigPath, 'utf8'));

const { sqlite_path: sqlitePath } = dbConfig;

const db = new sqlite3.Database(sqlitePath);
const app = express();
app.use(express.json()); 

// Configure file storage
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

app.post('/employees', upload.fields([{ name: 'photo' }, { name: 'document' }]), (req, res) => {
    const { full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, id } = req.body;

    const photo = req.files['photo'] ? req.files['photo'][0].buffer : null;
    const document = req.files['document'] ? req.files['document'][0].buffer : null;

    if (id) {
        // Update employee
        const sql = `UPDATE employees SET 
            full_name = ?, email = ?, phone = ?, position = ?, department = ?, salary = ?, 
            hire_date = ?, date_of_birth = ?, address = ?, photo = ?, document = ? WHERE id = ?`;

        db.run(sql, [full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photo, document, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Employee updated successfully' });
        });
    } else {
        // Insert new employee
        const sql = `INSERT INTO employees 
            (full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photo, document) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(sql, [full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photo, document], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Employee added successfully', id: this.lastID });
        });
    }
});

app.put('/employees/:id', upload.fields([{ name: 'photo' }, { name: 'document' }]), (req, res) => {
    const { full_name, email, phone, position, department, salary, hire_date, date_of_birth, address } = req.body;
    const photo = req.files['photo'] ? req.files['photo'][0].buffer : null;
    const document = req.files['document'] ? req.files['document'][0].buffer : null;

    const sql = `UPDATE employees SET 
         full_name = ?, email = ?, phone = ?, position = ?, department = ?, salary = ?, 
         hire_date = ?, date_of_birth = ?, address = ?, photo = ?, document = ? WHERE id = ?`;

    db.run(sql, [full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photo, document, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Employee updated successfully' });
    });
});


// Retrieve Employee Data (Including Photo & Document)
app.get('/employees/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM employees WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Employee not found" });

        res.json(row);
    });
});


