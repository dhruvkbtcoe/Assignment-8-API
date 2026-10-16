const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// MongoDB Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studentDB';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 1. Mongoose Schema & Model Definition
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  rollNo: {
    type: Number,
    required: [true, 'Roll number is required'],
    min: [1, 'Roll number must be greater than 0'],
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    default: 'Information Technology',
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [0, 'Marks cannot be less than 0'],
    max: [100, 'Marks cannot exceed 100'],
  },
});

const Student = mongoose.model('Student', studentSchema);

// Custom Helper Function for Input Validation
const validateStudentInput = (data) => {
  const { name, rollNo, marks } = data;

  if (name !== undefined) {
    const nameRule = /^[a-zA-Z\s]+$/;
    if (!nameRule.test(name.trim())) {
      return 'Name must contain only letters and spaces (numbers are not allowed)';
    }
  }

  if (rollNo !== undefined && Number(rollNo) <= 0) {
    return 'Roll number must be greater than 0';
  }

  if (marks !== undefined && (Number(marks) < 0 || Number(marks) > 100)) {
    return 'Marks must be between 0 and 100';
  }

  return null;
};

// --- CRUD ENDPOINTS ---

// CREATE: Add a new student record
app.post('/api/students', async (req, res) => {
  try {
    const validationError = validateStudentInput(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const newStudent = new Student(req.body);
    const savedStudent = await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: savedStudent,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// READ ALL: Fetch all student records
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// READ ONE: Fetch a single student by MongoDB ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid Student ID format' });
  }
});

// UPDATE: Update a student record by ID
app.put('/api/students/:id', async (req, res) => {
  try {
    const validationError = validateStudentInput(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE: Remove a student record by ID
app.delete('/api/students/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully',
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid Student ID format' });
  }
});

// Start the Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});