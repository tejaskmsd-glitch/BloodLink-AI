const Notification = require('../models/Notification');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

/**
 * Create a single in-app notification with optional duplicate prevention.
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  relatedId = null,
  preventDuplicate = true
}) => {
  try {
    if (!userId || !type || !title || !message) {
      return null;
    }

    if (preventDuplicate && relatedId) {
      const existing = await Notification.findOne({
        userId,
        type,
        relatedId: String(relatedId)
      });
      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId: relatedId ? String(relatedId) : null
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

/**
 * Send notification to multiple users simultaneously.
 */
const notifyUsers = async (
  userIds,
  { type, title, message, relatedId = null, preventDuplicate = true }
) => {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];

    const uniqueUserIds = [...new Set(userIds.map(id => id.toString()))];
    const created = await Promise.all(
      uniqueUserIds.map(uid =>
        createNotification({
          userId: uid,
          type,
          title,
          message,
          relatedId,
          preventDuplicate
        })
      )
    );
    return created.filter(Boolean);
  } catch (error) {
    console.error('Error notifying multiple users:', error.message);
    return [];
  }
};

/**
 * Notify all campus admins and system admins.
 */
const notifyAdmins = async ({
  type,
  title,
  message,
  relatedId = null,
  college = null,
  preventDuplicate = true
}) => {
  try {
    const adminRoles = [ROLES.ADMIN, ROLES.CAMPUS_ADMIN, ROLES.SUPER_ADMIN].filter(Boolean);
    const query = { role: { $in: adminRoles }, isActive: true };
    if (college) {
      // If college is given, notify admins matching that college or super admins
      query.$or = [{ college }, { role: ROLES.ADMIN }];
    }

    const admins = await User.find(query).select('_id');
    const notifications = await Promise.all(
      admins.map(admin =>
        createNotification({
          userId: admin._id,
          type,
          title,
          message,
          relatedId,
          preventDuplicate
        })
      )
    );
    return notifications.filter(Boolean);
  } catch (error) {
    console.error('Error notifying admins:', error.message);
    return [];
  }
};

module.exports = {
  createNotification,
  notifyUsers,
  notifyAdmins
};
