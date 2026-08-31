const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");

/**
 * Verifies Clerk JWT token from Authorization header.
 * Attaches req.auth.userId to the request on success.
 * Returns 401 if token is missing or invalid.
 */
const requireAuth = ClerkExpressRequireAuth({
  // Clerk SDK reads CLERK_SECRET_KEY from environment automatically
});

module.exports = { requireAuth };
