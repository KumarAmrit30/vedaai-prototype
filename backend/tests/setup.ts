process.env.MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/examforge-test";
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "test-gemini-key";
process.env.AUTH_ENABLED = process.env.AUTH_ENABLED ?? "false";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
