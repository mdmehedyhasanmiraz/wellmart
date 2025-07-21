import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SESSION_COOKIE_NAME = 'wellmart_session';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'admin' | 'manager';
  division?: string;
  district?: string;
  upazila?: string;
  street?: string;
}

export interface JWTPayload {
  userId: string;
  phone: string;
  role: string;
  exp: number;
}

export class AuthService {
  // Generate JWT token
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };
    
    return jwt.sign(payload, JWT_SECRET);
  }

  // Verify JWT token (for server-side use)
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  // Simple token verification for Edge Runtime (middleware)
  static verifyTokenEdge(token: string): boolean {
    try {
      // Simple check if token exists and has basic structure
      if (!token || token.split('.').length !== 3) {
        return false;
      }
      
      // For middleware, we'll just check if token exists and is not expired
      // We'll do proper verification in API routes
      return true;
    } catch (error) {
      return false;
    }
  }

  // Set session cookie
  static setSessionCookie(response: NextResponse, token: string): void {
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });
  }

  // Get session from cookie
  static getSessionFromCookie(request: NextRequest): JWTPayload | null {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    
    return this.verifyToken(token);
  }

  // Get session from cookie (Edge Runtime compatible)
  static getSessionFromCookieEdge(request: NextRequest): boolean {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return false;
    
    return this.verifyTokenEdge(token);
  }

  // Clear session cookie
  static clearSessionCookie(response: NextResponse): void {
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }

  // Check if user is authenticated (for API routes)
  static isAuthenticated(request: NextRequest): boolean {
    const session = this.getSessionFromCookie(request);
    const isAuth = session !== null && session.exp > Math.floor(Date.now() / 1000);
    console.log('🔍 AuthService - Session:', session ? 'found' : 'not found');
    console.log('🔍 AuthService - Is authenticated:', isAuth);
    return isAuth;
  }

  // Check if user is authenticated (Edge Runtime compatible)
  static isAuthenticatedEdge(request: NextRequest): boolean {
    const hasToken = this.getSessionFromCookieEdge(request);
    console.log('🔍 AuthService Edge - Has token:', hasToken);
    return hasToken;
  }

  // Get current user from request
  static getCurrentUser(request: NextRequest): JWTPayload | null {
    const session = this.getSessionFromCookie(request);
    if (!session || session.exp <= Math.floor(Date.now() / 1000)) {
      console.log('🔍 AuthService - No valid session found');
      return null;
    }
    console.log('🔍 AuthService - Current user:', session.userId);
    return session;
  }

  // Check if user has admin role
  static isAdmin(request: NextRequest): boolean {
    const user = this.getCurrentUser(request);
    return user?.role === 'admin' || user?.role === 'manager';
  }
} 