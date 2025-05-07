Filename: whatsapp-api/src/config/auth.ts

export default {
  jwt: {
    secret: process.env.APP_SECRET || 'default',
    expiresIn: '1d',
  },
};