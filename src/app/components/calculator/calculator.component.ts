import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';


@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html'
})
export class CalculatorComponent {

 // Inyectamos Supabase directamente
  private supabaseService = inject(SupabaseService);

  amount: number | null = null;      
  buyRate: number | null = null;    
  sellRate: number | null = null;   
  fee: number = 0; 

 get totalCost(): number {
    return (this.amount || 0) * (this.buyRate || 0);
  }

  get netRevenue(): number {
    return ((this.amount || 0) * (this.sellRate || 0)) - this.fee;
  }

  get netProfit(): number {
    return this.netRevenue - this.totalCost;
  }

  get roiPercentage(): number {
    if (this.totalCost === 0) return 0;
    return (this.netProfit / this.totalCost) * 100;
  }

  // Nueva función asíncrona para guardar en la base de datos
  async saveOperation() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('transactions')
        .insert([
          {
            type: 'exchange',
            amount_in: this.totalCost,
            amount_out: this.netRevenue,
            exchange_rate: this.sellRate,
            fee_amount: this.fee,
            net_profit: this.netProfit,
            notes: 'Arbitraje rápido desde calculadora'
          }
        ]);

      if (error) throw error;
      
      alert('✅ ¡Operación registrada exitosamente!');
    } catch (error: any) {
      console.error('Error:', error.message);
      alert('❌ Error al guardar: ' + error.message);
    }
  }
}