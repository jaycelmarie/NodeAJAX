// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
    if (req.session.user) {
        // User is logged in, proceed to the next middleware
        next();
    } else {
        // User is not logged in, redirect or send an error response
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = { requireLogin };