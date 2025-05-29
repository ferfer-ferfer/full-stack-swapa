const express = require("express");
const { Notification } = require("../models");
const isAuthenticated = require("../middleware/auth");

const router = express.Router();

// Send a notification to a specific user
router.post("/send-notification", isAuthenticated, async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ message: 'userId and message are required' });
    }

    const notification = await Notification.create({
      userId: userId,
      message: message,
      isRead: false
    });

    res.status(201).json({ 
      message: 'Notification sent successfully', 
      notification: notification 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all notifications for the logged-in user
router.get("/get-notifications", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.ID_Users;

    const notifications = await Notification.findAll({
      where: { userId: userId },
      order: [['createdAt', 'DESC']] // Most recent first
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get unread notifications count
router.get("/unread-count", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.ID_Users;

    const count = await Notification.count({
      where: { 
        userId: userId,
        isRead: false 
      }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark notification as read
router.put("/mark-read/:id", isAuthenticated, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.ID_Users;

    const notification = await Notification.findOne({
      where: {
        ID_notification: notificationId,
        userId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ isRead: true });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.ID_Users;

    await Notification.update(
      { isRead: true },
      { where: { userId: userId, isRead: false } }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete notification
router.delete("/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.ID_Users;

    const notification = await Notification.findOne({
      where: {
        ID_notification: notificationId,
        userId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();

    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
