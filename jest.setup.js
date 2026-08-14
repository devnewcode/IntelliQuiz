
//auth.js imports mongodb.js, which checks MONGODB_URI, so these placeholder values prevent tests from failing.

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-placeholder'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-used-in-production'
