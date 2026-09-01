const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");

const isClerkConfigured = () => {
  const key = process.env.CLERK_SECRET_KEY;
  return key && !key.includes("YOUR_CLERK_SECRET_KEY") && key.startsWith("sk_");
};

/**
 * Verifies Clerk JWT token from Authorization header if Clerk is configured.
 * In local demo mode (no Clerk key set), attaches a default demo userId.
 */
const requireAuth = (req, res, next) => {
  if (!isClerkConfigured()) {
    req.auth = { userId: req.headers["x-demo-user-id"] || "demo_user" };
    return next();
  }
  return ClerkExpressRequireAuth({})(req, res, next);
};

module.exports = { requireAuth };
