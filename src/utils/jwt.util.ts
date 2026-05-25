import jwt from 'jsonwebtoken';
import config from '../config';

export interface AccessTokenPayload {
  sub: string;  
  email: string;
  roles: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;    
  sessionId: string;
  type: 'refresh';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwtSecret,
    { expiresIn: config.jwtAccessExpiry as jwt.SignOptions['expiresIn'] },
  );
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiry as jwt.SignOptions['expiresIn'] },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwtRefreshSecret) as RefreshTokenPayload;
}
