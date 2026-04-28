import { Component } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: 'notices' | 'products' | 'caja' | 'dashboard' | 'camera';
  fab?: boolean;
}

@Component({
  selector: 'stp-bottom-bar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './bottom-bar.component.html',
  styleUrl: './bottom-bar.component.scss',
})
export class BottomBarComponent {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard',  route: '/dashboard', icon: 'dashboard' },
    { label: 'Productos',  route: '/products',  icon: 'products'  },
    { label: 'Vender',     route: '/sale',      icon: 'camera', fab: true },
    { label: 'Caja',       route: '/caja',      icon: 'caja'      },
    { label: 'Noticias',   route: '/notices',   icon: 'notices'   },
  ];
}
