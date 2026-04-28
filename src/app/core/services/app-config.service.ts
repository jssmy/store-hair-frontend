import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  readonly appName = environment.appName;
  readonly apiUrl = environment.apiUrl;
  readonly endpoints = environment.endpoints;
  readonly whatsappUrl = environment.whatsappUrl;
  readonly websiteUrl = environment.websiteUrl;
  readonly logoUrl = environment.logoUrl;
  readonly production = environment.production;
}
