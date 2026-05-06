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
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'stp-input',
  imports: [FormsModule, IconComponent],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  /** Floating label text. When omitted, no label is rendered. */
  readonly label = input<string>('');
  readonly type = input<string>('text');
  readonly hasError = input<boolean>(false);
  readonly error = input<string>('');
  readonly id = input<string>('stp-' + Math.random().toString(36).slice(2, 7));
  readonly autocomplete = input<string>('off');

  readonly value = model<string>('');

  protected readonly focused = signal(false);
  protected readonly disabled = signal(false);

  /** true when type is password — enables built-in show/hide toggle */
  protected readonly hasErrorState = computed(() => this.hasError() || !!this.error());
  protected readonly isPassword = computed(() => this.type() === 'password');

  /** Tracks whether password is currently visible */
  protected readonly showPassword = signal(false);
  protected readonly toggleRippleActive = signal(false);
  private toggleRippleTimer = 0;

  /** Actual input type: toggles between 'password' and 'text' */
  protected readonly resolvedType = computed(() => {
    if (this.isPassword()) {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  });

  /** Label floats when focused OR has content */
  protected readonly floated = computed(
    () => this.focused() || (this.value()?.length ?? 0) > 0,
  );

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
    clearTimeout(this.toggleRippleTimer);
    this.toggleRippleActive.set(false);
    requestAnimationFrame(() => {
      this.toggleRippleActive.set(true);
      this.toggleRippleTimer = window.setTimeout(() => this.toggleRippleActive.set(false), 600);
    });
  }

  protected onFocus(): void {
    this.focused.set(true);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  protected onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  // ControlValueAccessor
  writeValue(v: string): void {
    this.value.set(v ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
