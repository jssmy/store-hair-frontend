import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'stp-select',
  imports: [FormsModule, NgClass, IconComponent],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Selecciona una opción');
  readonly options = input<SelectOption[]>([]);
  readonly hasError = input<boolean>(false);
  readonly error = input<string>('');
  readonly size = input<SelectSize>('md');
  readonly id = input<string>('stp-' + Math.random().toString(36).slice(2, 7));

  readonly value = model<string | number>('');

  protected readonly focused = signal(false);
  protected readonly disabled = signal(false);

  protected readonly floated = computed(
    () => this.focused() || this.value() !== '',
  );

  protected readonly hostClasses = computed(() => ({
    'stp-select-wrapper': true,
    'stp-focused': this.focused(),
    'stp-floated': this.floated(),
    'stp-disabled': this.disabled(),
    'stp-error': this.hasError() || !!this.error(),
    'stp-no-label': !this.label(),
    [`stp-select-wrapper--${this.size()}`]: true,
  }));

  private onChange: (v: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  protected onFocus(): void { this.focused.set(true); }

  protected onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  protected onSelectChange(event: Event): void {
    const v = (event.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: string | number): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string | number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
