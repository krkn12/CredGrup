require('dotenv').config({ path: './.env' });
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('ARBISCAN_API_KEY:', process.env.ARBISCAN_API_KEY);
console.log('MONGODB_URI:', process.env.MONGODB_URI);