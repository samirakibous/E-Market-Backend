export const isAdminOrOwner = async (req, res, next) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: 'Not authenticated' });

    const userIdFromParams = req.params.userId || req.params.id;

    if (req.user.role === 'admin') {
      console.log('Access: admin');
      return next();
    }

    if (req.user.id === userIdFromParams) {
      console.log('Access: owner');
      return next();
    }

    console.log('Access denied', {
      user: req.user.id,
      target: userIdFromParams,
      role: req.user.role,
    });
    return res.status(403).json({ message: 'Access denied' });
  } catch (err) {
    console.error('isAdminOrOwner error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
