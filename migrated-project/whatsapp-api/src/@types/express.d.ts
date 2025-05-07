Filename: whatsapp-api/src/@types/express.d.ts

declare namespace Express {
  export interface Request {
    user: {
      id: string;
    };
  }
}