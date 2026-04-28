import { Component, computed, input } from '@angular/core';

export type ShimmerRadius = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
    selector: 'stp-shimmer',
    templateUrl: './shimmer.component.html',
    styleUrl: './shimmer.component.scss',
    host: { '[class]': 'hostClass()' },
})
export class ShimmerComponent {
    readonly radius = input<ShimmerRadius>('md');

    protected readonly hostClass = computed(() => `stp-shimmer stp-shimmer--radius-${this.radius()}`);
}
