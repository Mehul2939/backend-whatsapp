const path = require("path");

/* ===============================
   ABSOLUTE UPLOAD PATH
================================ */
const uploadBasePath = path.join(
    __dirname,
    "../../../uploads"
);
exports.uploadBasePath = uploadBasePath;
