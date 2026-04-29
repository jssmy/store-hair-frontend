import { Injectable } from "@angular/core";
import { StorageService } from "./storage.service";
import { TokenPayload } from "../auth/token-payload";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthUserService {
    constructor(private readonly storageService: StorageService) {}

    async user(): Promise<AuthUser | null> {
        const token = await this.storageService.get<string>('access_token');
        if (!token) return null;

        const payload = TokenPayload.decode(token);
        if (!payload) return null;

        return { id: payload.sub, email: payload.email, name: payload.fullname };
    }
}