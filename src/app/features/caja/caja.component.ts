import { Component, signal, computed } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CurrencyPipe, DatePipe } from '@angular/common';

type MovimientoTipo = 'ingreso' | 'egreso';
type EstadoCaja = 'cerrada' | 'abierta';

interface Movimiento {
  id: string;
  tipo: MovimientoTipo;
  concepto: string;
  monto: number;
  hora: string;
}

@Component({
  selector: 'stp-caja',
  imports: [CurrencyPipe, DatePipe, IconComponent],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent {
  protected readonly today = new Date();

  protected readonly estado = signal<EstadoCaja>('abierta');
  protected readonly saldoInicial = signal(500.0);

  protected readonly movimientos = signal<Movimiento[]>([
    { id: '001', tipo: 'ingreso', concepto: 'Venta #1042',    monto: 120.0, hora: '08:15' },
    { id: '002', tipo: 'ingreso', concepto: 'Venta #1043',    monto: 85.5,  hora: '09:02' },
    { id: '003', tipo: 'egreso',  concepto: 'Compra insumos', monto: 45.0,  hora: '10:30' },
    { id: '004', tipo: 'ingreso', concepto: 'Venta #1044',    monto: 210.0, hora: '11:45' },
    { id: '005', tipo: 'egreso',  concepto: 'Gastos varios',  monto: 18.0,  hora: '12:10' },
    { id: '006', tipo: 'ingreso', concepto: 'Venta #1045',    monto: 67.0,  hora: '13:00' },
  ]);

  protected readonly totalIngresos = computed(() =>
    this.movimientos()
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + m.monto, 0)
  );

  protected readonly totalEgresos = computed(() =>
    this.movimientos()
      .filter(m => m.tipo === 'egreso')
      .reduce((acc, m) => acc + m.monto, 0)
  );

  protected readonly saldoActual = computed(
    () => this.saldoInicial() + this.totalIngresos() - this.totalEgresos()
  );

  protected toggleEstado(): void {
    this.estado.update(e => (e === 'abierta' ? 'cerrada' : 'abierta'));
  }
}
