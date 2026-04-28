import { Component } from '@angular/core';

@Component({
  selector: 'stp-app-footer',
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.scss',
})
export class AppFooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
