import { registerAs } from '@nestjs/config';

export default registerAs('apiKey', () => ({
  secret: process.env.API_KEY_SECRET,
}));
