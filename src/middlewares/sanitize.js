import mongoSanitize from "express-mongo-sanitize";

/**
 * Reject `$` and `.` keys in req.body/params/query to prevent
 * NoSQL query-selector injection.
 */
const sanitize = mongoSanitize({
  onSanitize: ({ key }) => {
    console.warn(`[security] Blocked potential injection key: ${key}`);
  },
});

export default sanitize;
