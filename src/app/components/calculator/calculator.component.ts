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
  private supabaseService = inject(SupabaseService);

  // NUEVO: Control del modo de cálculo
  calcMode: 'receive_bob' | 'send_brl' = 'receive_bob';
  
  // Variables de la operación
  inputAmount: number | null = null; // Reemplaza a targetAmountBob para ser dinámico
  buyRateBrl: number | null = null;      
  sellRateBob: number | null = null;     
  profitMarginPct: number = 5;           

  loadingRates = false;
  originalBinanceBuyBrl: number | null = null;

  // 1.5 Valor de 1 Real expresado en Bolivianos
  get costPerBrl(): number {
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    return this.sellRateBob / this.buyRateBrl; 
  }

  // 1. Costo real de producir 1 Boliviano expresado en Reales
  get costPerBob(): number {
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    return this.buyRateBrl / this.sellRateBob; 
  }

  // MATEMÁTICA INVERSA: Cuántos BOB vamos a entregar al final
  get calculatedBob(): number {
    if (!this.inputAmount) return 0;
    
    // Modo A: El cliente pidió BOB exactos
    if (this.calcMode === 'receive_bob') return this.inputAmount;
    
    // Modo B (Inverso): El cliente envió BRL, calculamos los BOB a entregar
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    const netBrl = this.inputAmount / (1 + (this.profitMarginPct / 100)); // Descontar ganancia
    const usdtBought = netBrl / this.buyRateBrl; // USDT comprados
    return usdtBought * this.sellRateBob; // BOB generados
  }

  // MATEMÁTICA NORMAL: Cuántos BRL vamos a cobrar al final
  get calculatedBrl(): number {
    if (!this.inputAmount) return 0;
    
    // Modo B: El cliente envió BRL exactos
    if (this.calcMode === 'send_brl') return this.inputAmount;

    // Modo A (Normal): El cliente pide BOB, calculamos los BRL a cobrar
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    const rawCost = this.inputAmount * this.costPerBob;
    return rawCost * (1 + (this.profitMarginPct / 100)); // Sumar ganancia
  }

  // Costo base universal en Reales (sin ganancia)
  get rawCostBrl(): number {
    return this.calculatedBob * this.costPerBob;
  }

  // Ganancia neta universal en Reales
  get netProfitBrl(): number {
    return this.calculatedBrl - this.rawCostBrl;
  }

  // API Spot (Se mantiene igual)
  async getBrlRate() {
    this.loadingRates = true;
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
      if (!response.ok) throw new Error('La API de Binance falló');
      const data = await response.json();
      
      this.buyRateBrl = parseFloat(data.price);
      this.originalBinanceBuyBrl = this.buyRateBrl;
    } catch (error: any) {
      console.error('Error al obtener BRL:', error);
      alert('Error de conexión. Ingresa la tasa de BRL manualmente.');
    } finally {
      this.loadingRates = false;
    }
  }

  async saveOperation() {
    if (!this.inputAmount || !this.buyRateBrl || !this.sellRateBob) {
      alert('Por favor llena todos los campos primero.');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('transactions')
        .insert([
          {
            type: 'remittance_p2p',
            amount_in: this.calculatedBrl, // Siempre guardamos los BRL recibidos
            amount_out: this.calculatedBob, // Siempre guardamos los BOB enviados
            exchange_rate: this.costPerBob,   
            fee_amount: 0, 
            net_profit: this.netProfitBrl,
            binance_buy_brl: this.originalBinanceBuyBrl,
            binance_sell_bob: null, 
            notes: `Margen: ${this.profitMarginPct}% | Modo: ${this.calcMode}`
          }
        ]);

      if (error) throw error;
      alert('✅ Remesa registrada exitosamente.');
      
      this.inputAmount = null;
      this.originalBinanceBuyBrl = null;
      
    } catch (error: any) {
      console.error('Error:', error.message);
      alert('❌ Error al guardar: ' + error.message);
    }
  }
}