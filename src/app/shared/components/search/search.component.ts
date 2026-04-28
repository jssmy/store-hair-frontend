import {
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type SearchSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'stp-search',
  imports: [FormsModule, NgClass, IconComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchComponent),
      multi: true,
    },
  ],
})
export class SearchComponent implements ControlValueAccessor {
  readonly placeholder = input<string>('Buscar…');
  readonly size = input<SearchSize>('md');
  readonly id = input<string>('stp-' + Math.random().toString(36).slice(2, 7));

  readonly value = model<string>('');
  readonly cleared = output<void>();

  protected readonly focused = signal(false);
  protected readonly disabled = signal(false);

  protected readonly hasValue = computed(() => (this.value()?.length ?? 0) > 0);

  protected readonly hostClasses = computed(() => ({
    'stp-search': true,
    [`stp-search--${this.size()}`]: true,
    'stp-search--focused': this.focused(),
    'stp-search--disabled': this.disabled(),
  }));

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected onFocus(): void { this.focused.set(true); }

  protected onBlur(): void {
    this.focused.set(false);
    this.onTouched();
  }

  protected onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  protected clear(): void {
    this.value.set('');
    this.onChange('');
    this.cleared.emit();
  }

  writeValue(v: string): void { this.value.set(v ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}
