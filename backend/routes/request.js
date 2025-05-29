const express = require("express");
const { Class,Request ,User, Skill,UserSkill } = require("../models");
const isAuthenticated = require("../middleware/auth");
const { Op } = require("sequelize");


const router = express.Router();

// Create a new request
router.post("/send-request", isAuthenticated, async (req, res) => {
  try {
    const sender_id = req.user.ID_Users; // Extracted from token
    const { reciver_id, skill: skillName, message, duration } = req.body;

    if (!reciver_id || !skillName || !message || !duration) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find skill by name
    const skillRecord = await Skill.findOne({ where: {skills_name: skillName } });

    if (!skillRecord) {
      return res.status(404).json({ message: `Skill '${skillName}' not found.` });
    }

    // Create the request
    const newRequest = await Request.create({
      sender_id,
      reciver_id,
      skill_id: skillRecord.ID_skill,
      message,
      duration,
      status_request: 'pending',
      created_at: new Date()
    });
        //  Create notification for the receiver
    await Notification.create({
      userId: reciver_id,
      message: ` You received a new class request for "${skillName}".`,
      isRead: false
    });
    res.status(201).json({ message: 'Request sent successfully', request: newRequest });
  } catch (err) {
    console.error('Request creation error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all requests for the logged-in user
router.get("/get-request", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.ID_Users;
    console.log("Authenticated user ID:", userId);

    const requests = await Request.findAll({
      where: {
        [Op.or]: [
          { sender_id: userId },
          { reciver_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'Sender',
          attributes: ['ID_Users', 'Users_name', 'profile_picture']
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['ID_Users', 'Users_name', 'profile_picture']
        },
        {
          model: Skill,
          attributes: ['ID_skill', 'skills_name']
        }
      ]
    });

      const formatted = await Promise.all(requests.map(async (req) => {
  try {
    const isSender = req.sender_id === userId;
    const otherUser = isSender ? req.Receiver : req.Sender;
    const otherUserId = otherUser?.ID_Users;

    // Fetch skills the other user can teach
    const skills = await UserSkill.findAll({
      where: {
        userId: otherUserId,
        type: 'teach'
      },
      include: {
        model: Skill,
        attributes: ['ID_skill', 'skills_name']
      }
    });

    const other_user_skills = skills.map(s => s.Skill);

    return {
      request_id: req.ID_request,
      role: isSender ? 'sender' : 'receiver',
      other_user_id: otherUserId,
      other_user_name: otherUser?.Users_name,
      other_user_photo: otherUser?.profile_picture,
      skill: req.Skill,
      status: req.status_request,
      message: req.message,
      duration: req.duration,
      created_at: req.created_at,
      other_user_skills
    };
  } catch (err) {
    console.error("Error formatting single request:", err);
    throw err; // So it gets caught by the outer try/catch
  }
      }));


    res.status(200).json(formatted);
  } catch (err) {
    console.error('Error fetching requests:', err); // This is the key error log
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Cancel request
router.delete('/cancel-request/:id', isAuthenticated, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.ID_Users;

    // Find the request where sender_id is the logged-in user
    const request = await Request.findOne({
      where: {
        ID_request: requestId,
        sender_id: userId,
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or you are not authorized to delete it.' });
    }

    // Delete the request record from the database
    await request.destroy();

    res.status(200).json({ message: `Request ${requestId} has been deleted.` });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Accept request
router.post('/accept-request/:id', isAuthenticated, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.ID_Users;

    // Find the request where reciver_id is the logged-in user
    const request = await Request.findOne({
      where: {
        ID_request: requestId,
        reciver_id: userId,
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or you are not authorized to accept it.' });
    }

    // Update status_request to 'accepted'
    await request.update({ status_request: 'accepted' });

    // Create a new class using request's duration
    const newClass = await Class.create({
      request_id: requestId,
      sender_id: request.sender_id,
      reciver_id: request.reciver_id,
      duration: request.duration,  // <-- here
      time_gone: 0,                // start at 0
      start_time: null,
      end_time: null,
      is_teacher_ready: false,
      is_student_ready: false,
      is_paused: false,
      is_active: false,
      skill_id: request.skill_id
    });

        const acceptedCount = await Request.count({
      where: {
        reciver_id: request.reciver_id,
        status_request: 'accepted'
      }
    });

     //  Notify sender that request was accepted
    await Notification.create({
      userId: request.sender_id,
      message: ` Your class request was accepted!`,
      isRead: false
    });

    // Award SP if 5 requests have been accepted
    if (acceptedCount === 5) {
      await calculateSP(request.sender_id, {
        type: 'applications',
        value: 5
      });
    }
    res.status(200).json({ message: `Request ${requestId} accepted and class created.`, class: newClass });

  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject a request
router.post('/reject-request/:id', isAuthenticated, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.ID_Users;

    // Find the request where reciver_id is the logged-in user
    const request = await Request.findOne({
      where: {
        ID_request: requestId,
        reciver_id: userId,
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or you are not authorized to reject it.' });
    }
        //  Notify sender that request was rejected
    await Notification.create({
      userId: request.sender_id,
      message: ` Your class request was rejected.`,
      isRead: false
    });
    // Update status_request to 'rejected'
    await request.update({ status_request: 'rejected' });

    res.status(200).json({ message: `Request ${requestId} has been rejected.` });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;