import { Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'stp-loader',
  imports: [IconComponent],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  /** Controls visibility — use *ngIf or the `visible` input. */
  readonly visible = input<boolean>(true);
}
