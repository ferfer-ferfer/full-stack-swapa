const express = require('express');
const router = express.Router();
const { Comment , User } = require('../models'); 
const authenticate = require('../middleware/auth');

// POST a new comment
router.post('/comments', authenticate, async (req, res) => {
  try {
    const sender_id = req.user.ID_Users;
    const { receiver_id, comment, rating } = req.body;

    if (!receiver_id || !comment || rating === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

   

    // Create the new comment
    const newComment = await Comment.create({
      sender_id,
      receiver_id,
      comment,
      rating
    });
    // Get all comments for the receiver to calculate the average rating
    const receiverComments = await Comment.findAll({
      where: { receiver_id },
      attributes: ['rating']
    });
    const nbr_rate = receiverComments.length;
    const totalRating = receiverComments.reduce((sum, c) => sum + c.rating, 0);
    const rate = nbr_rate > 0 ? totalRating / nbr_rate : 0;

    // Update the User model for the receiver
await User.update(
  { nbr_rate: nbr_rate, rate: rate },
  { where: { ID_Users: receiver_id } }
);
    //  Create notification for the receiver
    await Notification.create({
      userId: receiver_id,
      message: ` You received a new rating from a user: "${comment}" (${rating}/5)`,
      isRead: false
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE comment

router.delete('/comments/:id', authenticate, async (req, res) => {
  try {
    const commentId = req.params.id;
    const senderId = req.user.ID_Users;

    // Find the comment
    const comment = await Comment.findOne({ where: { id: commentId } });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Ensure only sender can delete
    if (comment.sender_id !== senderId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    const receiver_id = comment.receiver_id;

    // ✅ First delete the comment
    await comment.destroy();

    // Then recalculate receiver's rating and nbr_rate
    const receiverComments = await Comment.findAll({
      where: { receiver_id },
      attributes: ['rating']
    });

    const nbr_rate = receiverComments.length;
    const totalRating = receiverComments.reduce((sum, c) => sum + c.rating, 0);
    const rate = nbr_rate > 0 ? totalRating / nbr_rate : 0;

    // ✅ Update User's rate and nbr_rate
    await User.update(
      { nbr_rate: nbr_rate, rate: rate },
      { where: { ID_Users: receiver_id } }
    );

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get all comments for a specific user
router.get('/comments/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const comments = await Comment.findAll({
      where: { receiver_id: userId },
      attributes: ['id', 'comment', 'rating', 'sender_id', 'createdAt'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['ID_Users', 'Users_name', 'first_name', 'last_name', 'profile_picture']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET all comments for a user
router.get('/comments', authenticate, async (req, res) => {
  try {
    const userId =  req.user.ID_Users;  
    const comments = await Comment.findAll({
      where: { receiver_id: userId },
      attributes: ['id', 'comment', 'rating', 'sender_id', 'createdAt'],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['ID_Users', 'Users_name', 'first_name', 'last_name', 'profile_picture']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
console.log('Fetched comments:', comments);

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Count how many comments a user has received
router.get('/comments/count/:receiver_id', authenticate, async (req, res) => {
  try {
    const receiverId = req.params.receiver_id;

    const count = await Comment.count({
      where: { receiver_id: receiverId }
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
