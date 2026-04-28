import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: '[stp-icon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'iconClass()',
    'aria-hidden': 'true',
  },
  styles: [`
    :host {
      display: inline-block;
      line-height: 1;
      vertical-align: middle;
      flex-shrink: 0;
      font-style: normal;
    }
  `],
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly autofill = input<boolean>(true);

  private readonly themeService = inject(ThemeService);

  protected readonly iconClass = computed(() => {
    const fill = this.autofill() && this.themeService.theme() === 'dark';
    return fill ? `ph-fill ph-${this.name()}` : `ph ph-${this.name()}`;
  });
}
