import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
    CartItem,
    HAIR_TYPE_ICONS,
    HairType,
} from '../../../features/products/products.data';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';
import { InputNumericComponent } from '../input-numeric/input-numeric.component';

@Component({
    selector: 'stp-cart-item',
    imports: [DecimalPipe, InputNumericComponent, ButtonComponent, IconComponent],
    templateUrl: './cart-item.component.html',
    styleUrl: './cart-item.component.scss',
    host: { class: 'cart-item' },
})
export class CartItemComponent {
    readonly item = input.required<CartItem>();

    readonly quantityChange = output<number | undefined>();
    readonly remove = output<number>();

    protected readonly subtotal = computed(
        () => this.item().product.price * this.item().quantity,
    );

    protected hairTypeIcon(hairType: HairType): string {
        return HAIR_TYPE_ICONS[hairType];
    }
}
