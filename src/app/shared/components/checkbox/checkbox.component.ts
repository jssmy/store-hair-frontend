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

export type CheckboxVariant = 'primary' | 'success' | 'warning' | 'error';
export type CheckboxSize = 'sm' | 'md';

@Component({
  selector: 'stp-checkbox',
  imports: [FormsModule, NgClass],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly variant = input<CheckboxVariant>('primary');
  readonly size = input<CheckboxSize>('md');
  readonly id = input<string>('stp-' + Math.random().toString(36).slice(2, 7));
  readonly indeterminate = input<boolean>(false);

  readonly checked = model<boolean>(false);

  protected readonly disabled = signal(false);

  protected readonly hostClasses = computed(() => ({
    'stp-checkbox': true,
    [`stp-checkbox--${this.variant()}`]: true,
    [`stp-checkbox--${this.size()}`]: true,
    'stp-checkbox--checked': this.checked(),
    'stp-checkbox--indeterminate': this.indeterminate(),
    'stp-checkbox--disabled': this.disabled(),
  }));

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  protected toggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  writeValue(v: boolean): void { this.checked.set(!!v); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
