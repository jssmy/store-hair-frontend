import { Component, signal } from '@angular/core';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { InputNumericComponent } from '../../shared/components/input-numeric/input-numeric.component';
import { SearchComponent } from '../../shared/components/search/search.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { ShimmerComponent } from '../../shared/components/shimmer/shimmer.component';
import { TabsComponent } from '../../shared/components/tabs/tabs.component';
import { TagComponent } from '../../shared/components/tag/tag.component';

@Component({
  selector: 'stp-demo',
  imports: [
    AlertComponent, AvatarComponent, BadgeComponent, ButtonComponent,
    CardComponent, CheckboxComponent, EmptyStateComponent, IconComponent,
    InputComponent, InputNumericComponent, SearchComponent, SelectComponent,
    ShimmerComponent, TabsComponent, TagComponent,
  ],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.scss',
})
export class DemoComponent {
  // ── Tabs ─────────────────────────────────────────────────────
  protected readonly tabItems = [
    { value: 'a', label: 'Productos', icon: 'package' },
    { value: 'b', label: 'Ventas' },
    { value: 'c', label: 'Caja', icon: 'credit-card' },
    { value: 'd', label: 'Desactivado', disabled: true },
  ];
  protected readonly activeUnderline = signal('a');
  protected readonly activePills    = signal('a');
  protected readonly activeSegment  = signal('a');

  // ── Form controls ────────────────────────────────────────────
  protected readonly textVal     = signal('');
  protected readonly passwordVal = signal('');
  protected readonly errorVal    = signal('valor@invalido');
  protected readonly numericVal  = signal<number | undefined>(3);
  protected readonly searchVal   = signal('');
  protected readonly selectVal   = signal<string | number>('');

  protected readonly selectOptions = [
    { value: 'abarrotes', label: '🌾 Abarrotes' },
    { value: 'bebidas',   label: '🥤 Bebidas'   },
    { value: 'lacteos',   label: '🥛 Lácteos'   },
    { value: 'snacks',    label: '🍿 Snacks'     },
    { value: 'limpieza',  label: '🧹 Limpieza'  },
  ];

  // ── Checkboxes ───────────────────────────────────────────────
  protected readonly cbPrimary  = signal(true);
  protected readonly cbSuccess  = signal(true);
  protected readonly cbWarning  = signal(false);
  protected readonly cbError    = signal(false);
  protected readonly cbSmall    = signal(true);

  // ── Alert ────────────────────────────────────────────────────
  protected readonly alertVisible = signal(true);

  // ── Icons ────────────────────────────────────────────────────
  protected readonly ICONS = [
    'package', 'shopping-cart', 'magnifying-glass', 'check-circle', 'x-circle',
    'warning-circle', 'info', 'bell', 'user', 'users', 'credit-card',
    'truck', 'plus', 'pencil', 'trash', 'eye', 'eye-slash',
    'arrow-left', 'arrow-right', 'caret-down', 'squares-four', 'gear',
    'sign-out', 'currency-circle-dollar', 'receipt', 'chart-bar', 'flask',
    'house', 'lock', 'lock-open', 'envelope', 'phone', 'calendar',
  ];
}
