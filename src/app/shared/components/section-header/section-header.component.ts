import { Component, ElementRef, inject, input, output } from '@angular/core';
import { ButtonComponent } from '../../components/button/button.component';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'stp-section-header',
  imports: [ButtonComponent, IconComponent],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
})
export class SectionHeaderComponent {
  readonly elementRef = inject(ElementRef);
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly buttonLabel = input<string>();
  readonly newItem = output<void>();
}
