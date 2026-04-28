import { Component, computed, input, model, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';

export interface TabItem {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export type TabsVariant = 'underline' | 'pills' | 'segment';
export type TabsSize = 'sm' | 'md';

@Component({
  selector: 'stp-tabs',
  imports: [NgClass],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly tabs = input<TabItem[]>([]);
  readonly variant = input<TabsVariant>('underline');
  readonly size = input<TabsSize>('md');
  readonly fullWidth = input<boolean>(false);

  readonly activeTab = model<string>('');

  readonly tabChange = output<string>();

  protected readonly hostClasses = computed(() => ({
    'stp-tabs': true,
    [`stp-tabs--${this.variant()}`]: true,
    [`stp-tabs--${this.size()}`]: true,
    'stp-tabs--full': this.fullWidth(),
  }));

  protected selectTab(tab: TabItem): void {
    if (tab.disabled) return;
    this.activeTab.set(tab.value);
    this.tabChange.emit(tab.value);
  }

  protected isActive(tab: TabItem): boolean {
    return this.activeTab() === tab.value;
  }
}
