exports.isAuthenticated = (req) => {
  return !!req.userId;
};
