// controllers/notificationController.js
import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort(
      { createdAt: -1 }
    );
    res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: { notifications },
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification)
      return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json({
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};
