// Usage: node scripts/hashPassword.js "yourStrongPassword"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH.
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hashPassword.js <password>");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log(hash);
});
