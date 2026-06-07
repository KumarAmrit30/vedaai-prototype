declare global {
  namespace Express {
    interface Request {
      auth?: {
        uid: string;
        email?: string;
        name?: string;
        picture?: string;
      };
    }
  }
}

export {};
