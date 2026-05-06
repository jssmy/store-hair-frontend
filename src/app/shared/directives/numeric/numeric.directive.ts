import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { InputComponent } from '../../components/input/input.component';

const NAV_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End',
]);

/**
 * Restricts <stp-input> to numeric-only input and optionally enforces a min/max range.
 *
 * Usage:
 *   <stp-input stpNumeric />
 *   <stp-input stpNumeric [min]="0" [max]="100" />
 *   <stp-input stpNumeric [allowDecimal]="true" />
 */
@Directive({
  selector: 'stp-input[stpNumeric]',
  standalone: true,
})
export class StpNumericDirective {
  private readonly _host = inject(InputComponent);
  private readonly _el   = inject(ElementRef<HTMLElement>);

  readonly min          = input<number | null>(null);
  readonly max          = input<number | null>(null);
  readonly allowDecimal = input<boolean>(false);
  readonly allowNegative = input<boolean>(false);

  private get _native(): HTMLInputElement | null {
    return this._el.nativeElement.querySelector('input');
  }

  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (!this._isAllowed(event)) event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const raw = event.clipboardData?.getData('text') ?? '';
    const clean = this._sanitize(raw);
    if (!clean) return;

    const input = this._native;
    if (!input) return;

    const start = input.selectionStart ?? 0;
    const end   = input.selectionEnd   ?? 0;
    const merged = input.value.slice(0, start) + clean + input.value.slice(end);

    this._applyValue(merged);
  }

  @HostListener('blur')
  protected onBlur(): void {
    const min = this.min();
    const max = this.max();
    if (min === null && max === null) return;

    const num = parseFloat(this._host.value());
    if (isNaN(num)) return;

    const clamped = this._clamp(num, min, max);
    if (clamped !== num) this._applyValue(String(clamped));
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _isAllowed(event: KeyboardEvent): boolean {
    const { key, ctrlKey, metaKey } = event;

    if (ctrlKey || metaKey) return true;
    if (NAV_KEYS.has(key))  return true;
    if (/^\d$/.test(key))   return true;

    if (this.allowDecimal() && key === '.') {
      // Only one decimal point
      return !(this._native?.value ?? this._host.value()).includes('.');
    }

    if (this.allowNegative() && key === '-') {
      // Minus only at cursor position 0
      return (this._native?.selectionStart ?? 0) === 0;
    }

    return false;
  }

  private _sanitize(value: string): string {
    const d = this.allowDecimal();
    const n = this.allowNegative();

    if (d && n) return value.replace(/[^0-9.\-]/g, '');
    if (d)      return value.replace(/[^0-9.]/g, '');
    if (n)      return value.replace(/[^0-9\-]/g, '');
    return value.replace(/[^0-9]/g, '');
  }

  private _clamp(value: number, min: number | null, max: number | null): number {
    let v = value;
    if (min !== null) v = Math.max(v, min);
    if (max !== null) v = Math.min(v, max);
    return v;
  }

  /** Sets the native input value and dispatches an `input` event so the
   *  InputComponent's CVA handler fires — keeping model and form controls in sync. */
  private _applyValue(value: string): void {
    const input = this._native;
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
