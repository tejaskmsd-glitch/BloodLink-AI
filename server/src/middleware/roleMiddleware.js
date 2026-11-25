const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const isAuthorized = roles.some(role => {
      if (role === userRole) return true;
      if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(role) && ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(userRole)) return true;
      if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(role) && ['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(userRole)) return true;
      return false;
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = { authorize };
