const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function run() {
  const password = process.argv[2];

  if (!password) {
    console.log("Provide password");
    process.exit(1);
  }

  const hash = await hashPassword(password);

  console.log(hash);
}

run();