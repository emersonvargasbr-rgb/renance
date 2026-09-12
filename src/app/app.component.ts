import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculatorComponent } from './components/calculator/calculator.component';
import { FinanceControlComponent } from './components/finance-control.component/finance-control.component';
import { SmmPanelComponent } from './components/smm-panel.component/smm-panel.component';


@Component({
  selector: 'app-root',
  standalone: true,
  // IMPORTANTE: Debes importar aquí los componentes que vas a usar
  imports: [CommonModule, CalculatorComponent, FinanceControlComponent, SmmPanelComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  // Estado inicial: arranca en la calculadora
  activeTab: 'calculator' | 'finance' | 'smm' = 'smm';
}