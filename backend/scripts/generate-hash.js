import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'Admin123!';
bcrypt.hash(password, 12).then((hash) => {
  console.log(`Password: ${password}`);
  console.log(`Bcrypt Hash: ${hash}`);
});

