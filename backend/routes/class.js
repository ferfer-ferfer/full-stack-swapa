// routes/class.js
const express = require("express");
const router = express.Router();
const { Class, User, Skill, Comment, ClassFile} = require("../models");
const authenticateJWT = require("../middleware/auth");
const multer = require("multer");
const { Sequelize, Op } = require('sequelize');
const calculateSP = require("../services/calculateSP");

const path = require("path");
const fs = require("fs");
// Define storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save to uploads folder
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// get all calsses


router.get("/classes", authenticateJWT, async (req, res) => {
  try {
    const currentUserId = req.user.ID_Users;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized: User ID not found" });
    }

    // Fetch current user info
    const currentUser = await User.findByPk(currentUserId, {
      attributes: ["ID_Users", "Users_name", "profile_picture"],
    });

    // Fetch classes where user is sender (Teacher) or receiver (Student)
    const classes = await Class.findAll({
      where: {
        [Op.or]: [
          { sender_id: currentUserId },
          { reciver_id: currentUserId }
        ]
      },
      attributes: [
        "ID_class",
        "sender_id",
        "reciver_id",
        "skill_id",
        "duration",
        "time_gone",
      ],
      include: [
        { model: User, as: "Teacher", attributes: ["ID_Users", "Users_name", 'profile_picture'] },
        { model: User, as: "Student", attributes: ["ID_Users", "Users_name", 'profile_picture'] },
      ],
      order: [["ID_class", "DESC"]],
    });

    // Extract unique skill IDs
    const skillIds = [...new Set(classes.map(c => c.skill_id).filter(id => id !== null))];

    // Fetch skill names
    const skills = await Skill.findAll({
      where: { ID_skill: skillIds },
      attributes: ["ID_skill", "skills_name"],
    });

    // Create skill ID → name map
    const skillMap = {};
    skills.forEach(skill => {
      skillMap[skill.ID_skill] = skill.skills_name;
    });

    // Format response
    const formatted = classes.map((c) => {
      const teacherId = c.Teacher?.ID_Users || null;
      const studentId = c.Student?.ID_Users || null;

      let type = null;
      if (currentUserId === teacherId) type = "teacher";
      else if (currentUserId === studentId) type = "learner";

      return {
        class_id: c.ID_class,
        sender_id: teacherId,
        reciver_id: studentId,
        sender_name: c.Teacher?.Users_name || null,
        receiver_name: c.Student?.Users_name || null,
        skill_name: skillMap[c.skill_id] || null,
        duration: c.duration,
        time_gone: c.time_gone || 0,
        type,
      };
    });

    // Send response
    res.json({
      user_photo: currentUser.profile_picture,
      user_name: currentUser.Users_name,
      classes: formatted,
    });

  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


//Hedi te3 delete file
router.delete("/file/:fileId", authenticateJWT, async (req, res) => {
  const fileId = req.params.fileId;
  

  try {
    const file = await ClassFile.findByPk(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Optional: Only allow the uploader to delete the file
    if (file.user_id != req.user.ID_Users) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this file" });
    }

    // Delete the file from the filesystem
    fs.unlink(path.resolve(file.filepath), async (err) => {
      if (err) {
        console.error("Error deleting file from disk:", err);
        return res
          .status(500)
          .json({ message: "Failed to delete file from disk" });
      }

      // Delete the DB record after successful file deletion
      await file.destroy();

      res.json({ message: "File deleted successfully" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// GET files uploaded to a class


router.get("/files/:Id_class", authenticateJWT, async (req, res) => {
  const classId = req.params.Id_class;

  try {
    const files = await ClassFile.findAll({
      where: { class_id: classId },
      attributes: ["id", "user_id", "filename", "filepath", "uploaded_at"],
    });

    const filesWithSize = files.map(file => {
      // Use the stored filepath directly (absolute or relative to project root)
      const fullPath = path.resolve(file.filepath);

      let sizeKB = null;
      try {
      const stats = fs.statSync(fullPath);
      sizeKB = Math.round(stats.size / 1024); // Size in KB
      } catch (err) {
      console.warn(`Could not access file: ${fullPath}`, err.message);
      }

      return {
        id: file.id,
        user_id: file.user_id,
        filename: file.filename,
        filepath: file.filepath,
        uploaded_at: file.uploaded_at,
        sizeKB,  // add size in KB
      };
    });

    res.json(filesWithSize);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch files" });
  }
});


//download files
router.get("/file/download/:fileId", async (req, res) => {
  const fileId = req.params.fileId;

  try {
    const file = await ClassFile.findByPk(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    const filePath = path.resolve(file.filepath);
    const fileName = file.filename;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      mime.lookup(filePath) || "application/octet-stream"
    );

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);

    readStream.on("error", (err) => {
      console.error("File stream error:", err);
      res.status(500).end();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload file to a class
router.post("/upload/:Id_class",  authenticateJWT,upload.single("file"),async (req, res) => {
    const classId = req.params.Id_class;
    const userId = req.user.ID_Users;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Using Sequelize model ClassFile to create the record
      const uploadedFile = await ClassFile.create({
        class_id: classId,
        user_id: userId,
        filename: req.file.originalname,
        filepath: req.file.path,
      });
      console.log("Upload route hit");
      console.log("Uploaded file info:", req.file);

      res.json({ message: "File uploaded successfully", file: uploadedFile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// get class details by ID
router.get("/:ID_class", authenticateJWT, async (req, res) => {
  try {
    const { ID_class } = req.params;
    const userId = req.user.ID_Users;

    const classSession = await Class.findOne({
      where: { ID_class: ID_class },
      include: [
        {
          model: User,
          as: "Teacher",
          attributes: ["ID_Users", "Users_name", "profile_picture"],
        },
        {
          model: User,
          as: "Student",
          attributes: ["ID_Users", "Users_name", "profile_picture"],
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // Determine user role and participants
    let userRole, currentUser, otherUser;

    if (classSession.Teacher && classSession.Teacher.ID_Users === userId) {
      userRole = "teacher";
      currentUser = classSession.Teacher;
      otherUser = classSession.Student;
    } else if (classSession.Student && classSession.Student.ID_Users === userId) {
      userRole = "student";
      currentUser = classSession.Student;
      otherUser = classSession.Teacher;
    } else {
      return res.status(403).json({ message: "You are not part of this class session" });
    }

    // Calculate elapsed time if session is active
    let elapsedTime = classSession.elapsed_seconds || 0;
    if (classSession.is_active && !classSession.is_paused && classSession.start_time) {
      const currentSessionTime = Math.floor((new Date() - new Date(classSession.start_time)) / 1000);
      elapsedTime += currentSessionTime;
    }

    const response = {
      userRole,
      classInfo: {
        id: classSession.ID_class,
        isActive: classSession.is_active,
        isPaused: classSession.is_paused,
        teacherReady: classSession.is_teacher_ready,
        studentReady: classSession.is_student_ready,
        startTime: classSession.start_time,
        elapsedTime,
        pointsEarned: Math.floor(elapsedTime / 2)
      },
      currentUser: {
        id: currentUser.ID_Users,
        username: currentUser.Users_name,
        profilePicture: currentUser.profile_picture,
      },
      otherUser: {
        id: otherUser.ID_Users,
        username: otherUser.Users_name,
        profilePicture: otherUser.profile_picture,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("[Class Status Error]", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current session status with calculated elapsed time
router.get("/:ID_class/status", authenticateJWT, async (req, res) => {
  try {
    const { ID_class } = req.params;
    const userId = req.user.ID_Users;

    const classSession = await Class.findOne({
      where: { ID_class: ID_class },
      include: [
        {
          model: User,
          as: "Teacher",
          attributes: ["ID_Users", "Users_name", "profile_picture"],
        },
        {
          model: User,
          as: "Student", 
          attributes: ["ID_Users", "Users_name", "profile_picture"],
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // Check if user is part of this class
    const isTeacher = classSession.Teacher && classSession.Teacher.ID_Users === userId;
    const isStudent = classSession.Student && classSession.Student.ID_Users === userId;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not part of this class session" });
    }

    // Calculate current elapsed time with better precision
    let currentElapsedTime = classSession.elapsed_seconds || 0;
    
    if (classSession.is_active && !classSession.is_paused && classSession.start_time) {
      const currentSessionTime = Math.floor((new Date() - new Date(classSession.start_time)) / 1000);
      currentElapsedTime += currentSessionTime;
    }

    const currentPoints = Math.floor(currentElapsedTime / 2);

    const response = {
      isActive: classSession.is_active,
      isPaused: classSession.is_paused,
      isTeacherReady: classSession.is_teacher_ready,
      isStudentReady: classSession.is_student_ready,
      elapsedTime: currentElapsedTime,
      pointsEarned: currentPoints,
      startTime: classSession.start_time,
      endTime: classSession.end_time,
      pausedAt: classSession.paused_at,
      teacher: {
        id: classSession.Teacher.ID_Users,
        name: classSession.Teacher.Users_name,
        profilePicture: classSession.Teacher.profile_picture
      },
      student: {
        id: classSession.Student.ID_Users,
        name: classSession.Student.Users_name,
        profilePicture: classSession.Student.profile_picture
      },
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("[Get Status Error]", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle ready status
router.post("/:ID_class/ready", authenticateJWT, async (req, res) => {
  try {
    const { ID_class } = req.params;
    const userId = req.user.ID_Users;

    const classSession = await Class.findOne({
      where: { ID_class: ID_class },
      include: [
        {
          model: User,
          as: "Teacher",
          attributes: ["ID_Users", "Users_name"],
        },
        {
          model: User,
          as: "Student",
          attributes: ["ID_Users", "Users_name"],
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // Check if user is part of this class
    const isTeacher = classSession.Teacher && classSession.Teacher.ID_Users === userId;
    const isStudent = classSession.Student && classSession.Student.ID_Users === userId;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not part of this class session" });
    }

    // Determine which ready field to toggle
    let updateData = {};
    let currentTeacherReady = classSession.is_teacher_ready;
    let currentStudentReady = classSession.is_student_ready;

    if (isTeacher) {
      currentTeacherReady = !currentTeacherReady;
      updateData.is_teacher_ready = currentTeacherReady;
    } else {
      currentStudentReady = !currentStudentReady;
      updateData.is_student_ready = currentStudentReady;
    }

    // Update the ready status
    await Class.update(updateData, {
      where: { ID_class: ID_class }
    });

    let message = `Ready status updated`;
    let sessionStarted = false;
    let sessionResumed = false;
    let startTime = null;

    // Check if both are ready and handle session state
    if (currentTeacherReady && currentStudentReady) {
      if (!classSession.is_active) {
        // Start new session
        startTime = new Date();
        await Class.update({
          is_active: true,
          is_paused: false,
          start_time: startTime,
          elapsed_seconds: 0,
          is_teacher_ready: false,
          is_student_ready: false
        }, {
          where: { ID_class: ID_class }
        });
        
        message = "Session started!";
        sessionStarted = true;
        currentTeacherReady = false;
        currentStudentReady = false;
        
      } else if (classSession.is_active && classSession.is_paused) {
        // Resume paused session
        startTime = new Date();
        await Class.update({
          is_paused: false,
          start_time: startTime,
          is_teacher_ready: false,
          is_student_ready: false
        }, {
          where: { ID_class: ID_class }
        });
        
        message = "Session resumed!";
        sessionResumed = true;
        currentTeacherReady = false;
        currentStudentReady = false;
      }
    }

    const response = {
      message,
      teacherReady: currentTeacherReady,
      studentReady: currentStudentReady,
      sessionStarted,
      sessionResumed,
      startTime
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("[Toggle Ready Error]", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to pause timer session
router.post("/:ID_class/pause", authenticateJWT, async (req, res) => {
  try {
    const { ID_class } = req.params;
    const userId = req.user.ID_Users;

    const classSession = await Class.findOne({
      where: { ID_class: ID_class },
      include: [
        {
          model: User,
          as: "Teacher",
          attributes: ["ID_Users"],
        },
        {
          model: User,
          as: "Student",
          attributes: ["ID_Users"],
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // Check if user is part of this class
    const isTeacher = classSession.Teacher && classSession.Teacher.ID_Users === userId;
    const isStudent = classSession.Student && classSession.Student.ID_Users === userId;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not part of this class session" });
    }

    // Check if session is active and not already paused
    if (!classSession.is_active || classSession.is_paused) {
      return res.status(400).json({ message: "Session is not active or already paused" });
    }

    // Calculate elapsed time when pausing
    let elapsedTime = classSession.elapsed_seconds || 0;
    
    if (classSession.start_time) {
      const currentSessionTime = Math.floor((new Date() - new Date(classSession.start_time)) / 1000);
      elapsedTime += currentSessionTime;
    }

    // Pause the session and save elapsed time
    await Class.update({
      is_paused: true,
      is_teacher_ready: false,
      is_student_ready: false,
      elapsed_seconds: elapsedTime,
      paused_at: new Date()
    }, {
      where: { ID_class: ID_class }
    });

    const pointsEarned = Math.floor(elapsedTime / 2);

    const response = {
      message: "Session paused successfully",
      isActive: true,
      isPaused: true,
      elapsedTime: elapsedTime,
      pointsEarned: pointsEarned,
      teacherReady: false,
      studentReady: false
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("[Pause Session Error]", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to end timer session
router.post("/:ID_class/end", authenticateJWT, async (req, res) => {
  try {
    const { ID_class } = req.params;
    const userId = req.user.ID_Users;
    const { reason } = req.body;

    const classSession = await Class.findOne({
      where: { ID_class: ID_class },
      include: [
        {
          model: User,
          as: "Teacher",
          attributes: ["ID_Users"],
        },
        {
          model: User,
          as: "Student",
          attributes: ["ID_Users"],
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // Check if user is part of this class
    const isTeacher = classSession.Teacher && classSession.Teacher.ID_Users === userId;
    const isStudent = classSession.Student && classSession.Student.ID_Users === userId;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not part of this class session" });
    }

    // Check if session is active
    if (!classSession.is_active) {
      return res.status(400).json({ message: "Session is not active" });
    }

    // Calculate final elapsed time
    let elapsedTime = classSession.elapsed_seconds || 0;
    
    if (!classSession.is_paused && classSession.start_time) {
      // Add time since last start/resume
      const currentSessionTime = Math.floor((new Date() - new Date(classSession.start_time)) / 1000);
      elapsedTime += currentSessionTime;
    }

    const pointsEarned = Math.floor(elapsedTime / 2);

    // End the session
    await Class.update({
      is_active: false,
      is_paused: false,
      end_time: new Date(),
      is_teacher_ready: false,
      is_student_ready: false,
      elapsed_seconds: elapsedTime,
      points_earned: pointsEarned,
      end_reason: reason || null
    }, {
      where: { ID_class: ID_class }
    });

    const response = {
      message: "Session ended successfully",
      isActive: false,
      isPaused: false,
      elapsedTime: elapsedTime,
      pointsEarned: pointsEarned,
      endTime: new Date(),
      reason: reason || null
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("[End Session Error]", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Route to get current session status with calculated elapsed time
router.get("/:ID_class/status", authenticateJWT, async (req, res) => {
  try {
    const { ID_class } = req.params;
    const userId = req.user.ID_Users;

    const classSession = await Class.findOne({
      where: { ID_class: ID_class },
      include: [
        {
          model: User,
          as: "Teacher",
          attributes: ["ID_Users", "Users_name", "profile_picture"],
        },
        {
          model: User,
          as: "Student", 
          attributes: ["ID_Users", "Users_name", "profile_picture"],
        },
      ],
    });

    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    // Check if user is part of this class
    const isTeacher = classSession.Teacher.ID_Users === userId;
    const isStudent = classSession.Student.ID_Users === userId;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You are not part of this class session" });
    }

    // Calculate current elapsed time
    let currentElapsedTime = classSession.elapsed_seconds || 0;
    
    if (classSession.is_active && !classSession.is_paused && classSession.start_time) {
      const currentSessionTime = Math.floor((new Date() - new Date(classSession.start_time)) / 1000);
      currentElapsedTime += currentSessionTime;
    }

    const currentPoints = Math.floor(currentElapsedTime / 2);

    const response = {
      isActive: classSession.is_active,
      isPaused: classSession.is_paused,
      isTeacherReady: classSession.is_teacher_ready,
      isStudentReady: classSession.is_student_ready,
      elapsedTime: currentElapsedTime,
      pointsEarned: currentPoints,
      startTime: classSession.start_time,
      endTime: classSession.end_time,
      pausedAt: classSession.paused_at,
      teacher: {
        id: classSession.Teacher.ID_Users,
        name: classSession.Teacher.Users_name,
        profilePicture: classSession.Teacher.profile_picture
      },
      student: {
        id: classSession.Student.ID_Users,
        name: classSession.Student.Users_name,
        profilePicture: classSession.Student.profile_picture
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("[Get Status Error]", error);
    res.status(500).json({ message: "Server error" });
  }
});



// class ready 
router.post('/:id/ready', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.ID_Users;
    const classId = req.params.id;

    // Find the class session with associated users
    const classSession = await Class.findOne({
      where: { ID_class: classId },
      include: [
        {
          model: User,
          as: 'Teacher',
          attributes: ['ID_Users']
        },
        {
          model: User,
          as: 'Student',
          attributes: ['ID_Users']
        }
      ]
    });

    if (!classSession) {
      return res.status(404).json({ error: 'Class session not found' });
    }

    // Determine user role
    const isTeacher = userId === classSession.Teacher.ID_Users;
    const isStudent = userId === classSession.Student.ID_Users;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: 'User not part of this class session' });
    }

    // Update ready status based on role
    if (isTeacher) {
      classSession.is_teacher_ready = true;
    } else {
      classSession.is_student_ready = true;
    }

    // Check if both parties are ready
    const bothReady = classSession.is_teacher_ready && classSession.is_student_ready;

    if (bothReady) {
      if (!classSession.is_active) {
        // Start new session
        classSession.start_time = new Date();
        classSession.is_active = true;
        classSession.is_paused = false;
      } else if (classSession.is_paused) {
        // Resume paused session
        classSession.is_paused = false;
      }

      // Mark both users as busy
      await User.update(
        { classstatus: 'busy' },
        { 
          where: { 
            ID_Users: [classSession.Teacher.ID_Users, classSession.Student.ID_Users] 
          } 
        }
      );
    }

    await classSession.save();

    return res.json({ 
      success: true, 
      classInfo: {
        isActive: classSession.is_active,
        isPaused: classSession.is_paused,
        teacherReady: classSession.is_teacher_ready,
        studentReady: classSession.is_student_ready,
        startTime: classSession.start_time
      }
    });

  } catch (error) {
    console.error('Error in /class/:id/ready:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});


router.post("/:Id_class/feedback", authenticateJWT, async (req, res) => {
  const classId = req.params.Id_class;
  const userId = req.user.ID_Users;
  const { rating, comment, endreason } = req.body;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  // Validate comment
  if (!comment || comment.trim().length < 3) {
    return res.status(400).json({ message: "Comment must be at least 3 characters long" });
  }

  if (comment.length > 500) {
    return res.status(400).json({ message: "Comment must be less than 500 characters" });
  }

  try {
    // Find the class instance
    const classInstance = await Class.findOne({
      where: { ID_Class: classId },
      attributes: ['ID_Class', 'sender_id', 'receiver_id']
    });

    if (!classInstance) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Determine who is giving feedback and who is receiving it
    let senderId, receiverId;
    
    // The current user (userId) is giving feedback
    // We need to determine if they are the sender or receiver of the class
    if (classInstance.sender_id === userId) {
      // Current user is the original sender, so they're giving feedback to the receiver
      senderId = userId;
      receiverId = classInstance.receiver_id;
    } else if (classInstance.receiver_id === userId) {
      // Current user is the original receiver, so they're giving feedback to the sender
      senderId = userId;
      receiverId = classInstance.sender_id;
    } else {
      return res.status(403).json({ message: "Unauthorized to give feedback for this class" });
    }

    // Create the feedback
    const feedback = await Comment.create({
      sender_id: senderId,
      receiver_id: receiverId,
      rating: parseInt(rating),
      comment: comment.trim(),
      endreason: endreason || null,
      class_id: classId // Add class_id if your Comment model has this field
    });

    // Get the username of the person giving feedback for the notification
    const senderUser = await User.findByPk(senderId, { 
      attributes: ['username'] 
    });
    const senderUsername = senderUser ? senderUser.username : 'Unknown user';

    // Create notification for the person receiving the feedback
    await Notification.create({
      userId: receiverId,
      message: `You received new feedback from ${senderUsername}`,
      isRead: false,
    });

    res.json({ 
      message: "Feedback submitted successfully", 
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        comment: feedback.comment,
        endreason: feedback.endreason
      }
    });

  } catch (err) {
    console.error('Feedback submission error:', err);
    res.status(500).json({ message: "Server error while submitting feedback" });
  }
});

module.exports = router;
