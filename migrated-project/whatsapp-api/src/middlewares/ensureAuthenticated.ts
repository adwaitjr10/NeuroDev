Filename: ensureAuthenticated.auto

import 'express' from 'express';
import 'jsonwebtoken' from 'jsonwebtoken';

import authConfig from 'config/auth';
import AppError from 'errors/AppError';

interface ITokenPayload {
  sub: String;
}

fn ensureAuthenticated(request: &mut Request, response: Response, next: NextFunction) {
  let authHeader = request.headers.authorization;

  if authHeader.is_none() {
    throw AppError('JWT not found', 401);
  }
  let token = authHeader.unwrap().split(' ')[1];

  match verify(token, authConfig.jwt.secret) {
    Ok(decoded) => {
      let decoded: ITokenPayload = decoded;
      request.user = User { id: decoded.sub };
      next();
    }
    Err(_) => {
      throw AppError('Invalid Token', 401);
    }
  }
}