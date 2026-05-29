import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: 'notices' | 'products' | 'caja' | 'dashboard' | 'camera' | 'suppliers' | 'piggy-bank' | 'demo' | 'handbag';
}

@Component({
  selector: 'stp-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly isOpen = input(false);
  readonly closeRequest = output<void>();

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Vender',    route: '/sale',      icon: 'camera'    },
    { label: 'Orden de compra',    route: '/purchase-order',      icon: 'handbag'    },
    { label: 'Inventario', route: '/products',  icon: 'products'  },
    { label: 'Proveedores', route: '/suppliers',  icon: 'suppliers'  },
    // { label: 'Créditos', route: '/credits',  icon: 'piggy-bank'  },
    // { label: 'Caja',      route: '/caja',      icon: 'caja'      },
    // { label: 'Noticias',  route: '/notices',   icon: 'notices'   },
    // { label: 'Demo UI',   route: '/demo',      icon: 'demo'      },
  ];
}
