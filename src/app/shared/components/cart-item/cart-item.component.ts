import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
    CartItem,
    HAIR_TYPE_LABELS,
    HAIR_COLOR_HEX,
    HairType,
} from '../../../features/products/products.data';
import { IconComponent } from '../icon/icon.component';

const HAIR_TYPE_PHOSPHOR: Record<HairType, string> = {
    lote:        'scissors',
    viethanmita: 'flower-lotus',
    golden:      'sun',
    premium:     'sparkle',
};

@Component({
    selector: 'stp-cart-item',
    imports: [DecimalPipe, IconComponent],
    templateUrl: './cart-item.component.html',
    styleUrl: './cart-item.component.scss',
    host: { class: 'cart-item' },
})
export class CartItemComponent {
    readonly item            = input.required<CartItem>();
    readonly remove          = output<number>();
    readonly salePriceChange = output<{ productId: number; salePrice: number }>();

    /** Precio esperado = precio_por_gramo × gramos */
    protected readonly expectedPrice = computed(() => {
        const { price, weight } = this.item().product;
        return price * (weight ?? 1);
    });

    /** Valor del input nativo — inicializado una vez desde item().salePrice */
    protected readonly localSalePrice = signal<string>('');

    /** Estado de foco para el borde del control */
    protected readonly priceFocused = signal(false);

    private initialized = false;

    constructor() {
        effect(() => {
            const it = this.item();
            if (!this.initialized) {
                const init = it.salePrice ?? it.product.price * (it.product.weight ?? 1);
                this.localSalePrice.set(init.toFixed(2));
                this.initialized = true;
            }
        });
    }

    protected onPriceInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.localSalePrice.set(value);
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) {
            this.salePriceChange.emit({ productId: this.item().product.id, salePrice: num });
        }
    }

    protected onPriceBlur(event: Event): void {
        this.priceFocused.set(false);
        const el = event.target as HTMLInputElement;
        const num = parseFloat(el.value);
        const final = !isNaN(num) && num > 0 ? num : this.expectedPrice();
        el.value = final.toFixed(2);
        this.localSalePrice.set(final.toFixed(2));
        this.salePriceChange.emit({ productId: this.item().product.id, salePrice: final });
    }

    // ── Helpers de display ──────────────────────────────────────────────
    protected typeIcon(): string {
        return HAIR_TYPE_PHOSPHOR[this.item().product.type as HairType] ?? 'package';
    }

    protected typeLabel(): string {
        return HAIR_TYPE_LABELS[this.item().product.type as HairType]
            ?? (this.item().product.type ?? '');
    }

    protected imageUrl(): string | undefined {
        return this.item().product.imageUrl ?? this.item().product.imageUrls?.[0];
    }

    protected colorHex(): string {
        const c = this.item().product.color;
        return c ? HAIR_COLOR_HEX[c] : 'transparent';
    }

    protected colorTitle(): string {
        const c = this.item().product.color;
        if (!c) return '';
        return c === 'natural' ? 'Natural' : 'Pintado';
    }

    protected productCode(): string {
        return this.item().product.po ?? '';
    }
}
