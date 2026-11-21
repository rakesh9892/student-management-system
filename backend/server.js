  require("dotenv").config();

  const express = require("express");
  const cors = require("cors");
  const pool = require("./db");
  const path = require("path");
  const upload = require("./upload");
  const fs = require("fs");
  const cloudinary = require("./cloudinary");

  const app = express();

  // Check whether student ID is a valid positive integer
  const isValidStudentId = (id) => {
    return /^[1-9]\d*$/.test(id) &&
      Number.isSafeInteger(Number(id)) &&
      Number(id) <= 2147483647;
  };

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Allow the frontend to access uploaded photos
  app.use("/uploads", express.static(
    path.join(__dirname, "uploads")
  ));

  const deletePhoto = (photoUrl) => {
    if (!photoUrl) return;

    const filename = path.basename(photoUrl);
    const filePath = path.join(__dirname, "uploads", filename);

    fs.unlink(filePath, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error("Photo cleanup error:", error);
      }
    });
  };
  
    const useCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    // Upload an image from memory to Cloudinary
    const uploadToCloudinary = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "student-management-system",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          }
        );

        stream.end(buffer);
      });
    };

    // Delete a Cloudinary image using its public ID
    const deleteCloudinaryPhoto = async (photoUrl) => {
      if (!photoUrl) return;

      const url = new URL(photoUrl);
      const expectedHost = `res.cloudinary.com`;

      if (
        url.hostname !== expectedHost ||
        !url.pathname.startsWith(
          `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`
        )
      ) {
        return;
      }

      const uploadPath = url.pathname.split("/upload/")[1];
      if (!uploadPath) return;

      const publicId = uploadPath
        .replace(/^v\d+\//, "")
        .replace(/\.[^.]+$/, "");

      await cloudinary.uploader.destroy(publicId);
    };

  // Test server
  app.get("/", (req, res) => {
    res.json({
      message: "Student Management API is running",
    });
  });

  // Test database connection
  app.get("/students", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM students ORDER BY id DESC"
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Database error:", error);

      res.status(500).json({
        message: "Failed to fetch students",
      });
    }
  });


  // Validate student information
  const validateStudent = (student) => {

    // Check if student data is a valid object 
    if (!student || typeof student !== "object" || Array.isArray(student)) {
      return "Invalid student data";
    }
    
    const {
      name,
      course,
      year,
      dob,
      email,
      mobile_number,
      gender,
      address
    } = student;

    if (
      typeof name !== "string" || !name.trim() ||
      typeof course !== "string" || !course.trim() ||
      typeof dob !== "string" || !dob ||
      typeof email !== "string" || !email.trim() ||
      typeof mobile_number !== "string" || !mobile_number.trim() ||
      typeof gender !== "string" || !gender ||
      typeof address !== "string" || !address.trim()
    ) {
      return "All student fields are required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Invalid email address";
    }

    if (!/^\d{10}$/.test(mobile_number)) {
      return "Mobile number must contain exactly 10 digits";
    }

    if (![1, 2, 3, 4].includes(Number(year))) {
      return "Year must be between 1 and 4";
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return "Invalid gender";
    }

    const birthDate = new Date(dob);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
      Number.isNaN(birthDate.getTime()) ||
      birthDate.toISOString().slice(0, 10) !== dob ||
      birthDate > new Date()
    ) {
      return "Invalid date of birth";
    }
    if (name.length > 100 || course.length > 100) {
      return "Name and course must not exceed 100 characters";
    }

    if (email.length > 150) {
      return "Email must not exceed 150 characters";
    }
    return null;
  };

  // Add a new student
  app.post("/students", async (req, res) => {
    try {
      const {
        name,
        course,
        year,
        dob,
        email,
        mobile_number,
        gender,
        address
      } = req.body;

      // Validate student data
      const validationError = validateStudent(req.body);

      if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      const result = await pool.query(
        `INSERT INTO students
        (name, course, year, dob, email, mobile_number, gender, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          name,
          course,
          year,
          dob,
          email,
          mobile_number,
          gender,
          address
        ]
      );

      res.status(201).json({
        message: "Student added successfully",
        student: result.rows[0]
      });

    } catch (error) {
      console.error("Add student error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          message: "Student email already exists"
        });
      }

      if (error.code === "23514" || error.code === "22P02" || error.code === "22007" || error.code === "22008") {
        return res.status(400).json({
          message: "Invalid student data"
        });
      }

      res.status(500).json({
        message: "Failed to add student"
      });
    }
  });

  // Get a single student by ID
  app.get("/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
        if (!isValidStudentId(id)) {
        return res.status(400).json({
          message: "Invalid student ID"
        });
      }
      const result = await pool.query(
        "SELECT * FROM students WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      res.status(200).json(result.rows[0]);

    } catch (error) {
      console.error("Get student error:", error);

      res.status(500).json({
        message: "Failed to fetch student"
      });
    }
  });

  // Update an existing student
  app.put("/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
        if (!isValidStudentId(id)) {
        return res.status(400).json({
          message: "Invalid student ID"
        });
      }
      const {
        name,
        course,
        year,
        dob,
        email,
        mobile_number,
        gender,
        address
      } = req.body;

      // Validate student data
        const validationError = validateStudent(req.body);

        if (validationError) {
        return res.status(400).json({
          message: validationError
        });
      }

      const result = await pool.query(
        `UPDATE students
        SET name = $1,
            course = $2,
            year = $3,
            dob = $4,
            email = $5,
            mobile_number = $6,
            gender = $7,
            address = $8
        WHERE id = $9
        RETURNING *`,
        [
          name,
          course,
          year,
          dob,
          email,
          mobile_number,
          gender,
          address,
          id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      res.status(200).json({
        message: "Student updated successfully",
        student: result.rows[0]
      });

    } catch (error) {
      console.error("Update student error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          message: "Student email already exists"
        });
      }

      if (
        ["23514", "22P02", "22007", "22008"].includes(error.code)
      ) {
        return res.status(400).json({
          message: "Invalid student data"
        });
      }

      res.status(500).json({
        message: "Failed to update student"
      });
    }
  });

  // Delete a student
  app.delete("/students/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidStudentId(id)) {
        return res.status(400).json({
          message: "Invalid student ID"
        });
      }
      const result = await pool.query(
        "DELETE FROM students WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      deletePhoto(result.rows[0].photo_url);

      res.status(200).json({
        message: "Student deleted successfully"
      });


    } catch (error) {
      console.error("Delete student error:", error);

      res.status(500).json({
        message: "Failed to delete student"
      });
    }
  });

  
  // Upload or replace a student's photo
  app.post("/students/:id/photo", upload.single("photo"), async (req, res) => {
    let newCloudinaryUrl = null;

    const cleanupNewLocalFile = () => {
      if (req.file?.filename) {
        deletePhoto(`/uploads/${req.file.filename}`);
      }
    };

    try {
      const { id } = req.params;

      if (!isValidStudentId(id)) {
        cleanupNewLocalFile();

        return res.status(400).json({
          message: "Invalid student ID",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Student photo is required",
        });
      }

      const existing = await pool.query(
        "SELECT photo_url FROM students WHERE id = $1",
        [id]
      );

      if (existing.rows.length === 0) {
        cleanupNewLocalFile();

        return res.status(404).json({
          message: "Student not found",
        });
      }

      let photoUrl;

      if (useCloudinary) {
        const result = await uploadToCloudinary(req.file.buffer);
        photoUrl = result.secure_url;
        newCloudinaryUrl = photoUrl;
      } else {
        photoUrl = `/uploads/${req.file.filename}`;
      }

      const result = await pool.query(
        `UPDATE students
         SET photo_url = $1
         WHERE id = $2
         RETURNING *`,
        [photoUrl, id]
      );

      const oldPhotoUrl = existing.rows[0].photo_url;

      if (oldPhotoUrl) {
        try {
          if (oldPhotoUrl.startsWith("https://res.cloudinary.com/")) {
            await deleteCloudinaryPhoto(oldPhotoUrl);
          } else if (oldPhotoUrl.startsWith("/uploads/")) {
            deletePhoto(oldPhotoUrl);
          }
        } catch (cleanupError) {
          console.error("Old photo cleanup error:", cleanupError);
        }
      }

      res.status(200).json({
        message: "Student photo uploaded successfully",
        student: result.rows[0],
      });
    } catch (error) {
      cleanupNewLocalFile();

      if (newCloudinaryUrl) {
        try {
          await deleteCloudinaryPhoto(newCloudinaryUrl);
        } catch (cleanupError) {
          console.error("New photo cleanup error:", cleanupError);
        }
      }

      console.error("Photo upload error:", error);

      res.status(500).json({
        message: "Failed to upload student photo",
      });
    }
  });

  app.use((err, req, res, next) => {
    if (err) {
      return res.status(400).json({
        message: err.message
      });
    }

    next();
  });

  // Start server
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });