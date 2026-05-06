import { NgClass } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { Component, computed, forwardRef, input, model, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputNumericRadius = 'sm' | 'md' | 'lg' | 'full';
export type InputNumericSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'stp-input-numeric',
    imports: [NgClass, IconComponent],
    templateUrl: './input-numeric.component.html',
    styleUrl: './input-numeric.component.scss',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputNumericComponent),
            multi: true,
        },
    ],
})
export class InputNumericComponent implements ControlValueAccessor {
    readonly value  = model<number | undefined>(undefined);
    readonly min    = input<number>(1);
    readonly max    = input<number | null>(null);
    readonly radius = input<InputNumericRadius>('md');
    readonly size   = input<InputNumericSize>('md');
    readonly error  = input<string>('');

    

    private readonly _internalValue = signal<number>(0);
    private _onChange: (value: number) => void = () => {};
    private _onTouched: () => void = () => {};

    protected readonly isDisabled = signal(false);

    protected readonly effectiveValue = computed(
        () => this.value() ?? this._internalValue(),
    );

    protected readonly canDecrement = computed(
        () => this.effectiveValue() > this.min(),
    );

    protected readonly canIncrement = computed(() => {
        const max = this.max();
        return max === null || this.effectiveValue() < max;
    });

    protected readonly classes = computed(() => ({
        'stp-input-numeric': true,
        [`stp-input-numeric--${this.size()}`]: true,
        [`stp-input-numeric--radius-${this.radius()}`]: true,
    }));

    // ControlValueAccessor
    writeValue(value: number): void {
        this._internalValue.set(value ?? this.min());
    }

    registerOnChange(fn: (value: number) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.isDisabled.set(isDisabled);
    }

    private emit(newValue: number): void {
        this._internalValue.set(newValue);
        this.value.set(newValue);
        this._onChange(newValue);
        this._onTouched();
    }

    protected decrement(): void {
        if (!this.canDecrement()) return;
        this.emit(this.effectiveValue() - 1);
    }

    protected increment(): void {
        if (!this.canIncrement()) return;
        this.emit(this.effectiveValue() + 1);
    }

    protected onInput(rawValue: string): void {
        const parsed = parseInt(rawValue, 10);
        if (isNaN(parsed)) return;
        const min = this.min();
        const max = this.max();
        const clamped = Math.max(parsed, min);
        this.emit(max !== null ? Math.min(clamped, max) : clamped);
    }
}
