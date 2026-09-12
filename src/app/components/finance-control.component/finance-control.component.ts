import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-finance-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-control.component.html'
})
export class FinanceControlComponent {
  private supabaseService = inject(SupabaseService);

  // Variables del Formulario
  selectedAsset: string = 'USDT';
  investedBrl: number | null = null;
  buyPriceBrl: number | null = null;
  targetSellBob: number | null = null;

  // MATEMÁTICA PRO:
  // 1. Cuánta Criptomoneda obtienes realmente
  get cryptoReceived(): number {
    if (!this.investedBrl || !this.buyPriceBrl) return 0;
    return this.investedBrl / this.buyPriceBrl;
  }

  // 2. Proyección de Capital en Bolivianos (Si lo vendes al precio objetivo)
  get projectedBob(): number {
    if (!this.targetSellBob) return 0;
    return this.cryptoReceived * this.targetSellBob;
  }

  // 3. Retorno de Inversión (ROI) Estimado en %
  get estimatedRoi(): number {
    if (!this.investedBrl || !this.buyPriceBrl || !this.targetSellBob) return 0;
    // Costo de producir 1 BOB = buyPriceBrl / targetSellBob
    const costPerBob = this.buyPriceBrl / this.targetSellBob;
    const totalBrlIfSold = this.projectedBob * costPerBob; 
    // Esta es una fórmula de arbitraje, calculamos el margen bruto
    const profitBrl = (this.projectedBob * (this.targetSellBob / this.buyPriceBrl)) - this.investedBrl;
    return (profitBrl / this.investedBrl) * 100;
  }

  async saveInventory() {
    if (!this.investedBrl || !this.buyPriceBrl) {
      alert('Llena el capital y el precio de compra como mínimo.');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('crypto_inventory')
        .insert([
          {
            asset: this.selectedAsset,
            invested_brl: this.investedBrl,
            buy_price_brl: this.buyPriceBrl,
            crypto_amount: this.cryptoReceived,
            target_sell_bob: this.targetSellBob,
            status: 'DISPONIBLE'
          }
        ]);

      if (error) throw error;
      alert('✅ Capital registrado en el inventario.');
      
      this.investedBrl = null;
      // Mantenemos los precios por si vas a registrar varias compras seguidas
    } catch (error: any) {
      console.error('Error:', error.message);
      alert('❌ Error al guardar: ' + error.message);
    }
  }
}