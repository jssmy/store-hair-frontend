export interface JwtPayload {
  sub: string;
  fullname: string;
  email: string;
  iat: number;
  exp: number;
}

export class TokenPayload {
  static decode(token: string): JwtPayload | null {
    try {
      const [, payloadB64] = token.split('.');
      const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }

  static isExpired(token: string): boolean {
    const payload = TokenPayload.decode(token);
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
  }

  static getUserId(token: string): string | null {
    return TokenPayload.decode(token)?.sub ?? null;
  }

  static getEmail(token: string): string | null {
    return TokenPayload.decode(token)?.email ?? null;
  }

  static getFullname(token: string): string | null {
    return TokenPayload.decode(token)?.fullname ?? null;
  }
}
