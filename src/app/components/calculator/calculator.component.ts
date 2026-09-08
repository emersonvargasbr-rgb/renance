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

  // Variables de la operación
  targetAmountBob: number | null = null; 
  buyRateBrl: number | null = null;      
  sellRateBob: number | null = null;     
  profitMarginPct: number = 5;           

  // Variables para la sincronización con Binance Spot (Solo BRL)
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

  // 2. Costo base (sin ganancia) para el monto total solicitado
  get rawCostBrl(): number {
    return (this.targetAmountBob || 0) * this.costPerBob;
  }

  // 3. Lo que le vas a cobrar al cliente (Costo + Margen)
  get totalBrlToCharge(): number {
    return this.rawCostBrl * (1 + (this.profitMarginPct / 100));
  }

  // 4. Tu ganancia neta y limpia en Reales
  get netProfitBrl(): number {
    return this.totalBrlToCharge - this.rawCostBrl;
  }

  // NUEVO: Conexión PRO a la API Pública de Binance Spot (100% segura, sin bloqueos)
  async getBrlRate() {
    this.loadingRates = true;
    try {
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
      
      if (!response.ok) throw new Error('La API de Binance falló');
      
      const data = await response.json();
      
      // Asignamos el valor exacto del mercado Spot
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
    if (!this.targetAmountBob || !this.buyRateBrl || !this.sellRateBob) {
      alert('Por favor llena todos los campos primero.');
      return;
    }

    try {
      const { error } = await this.supabaseService.client
        .from('transactions')
        .insert([
          {
            type: 'remittance_p2p',
            amount_in: this.totalBrlToCharge, 
            amount_out: this.targetAmountBob, 
            exchange_rate: this.costPerBob,   
            fee_amount: 0, 
            net_profit: this.netProfitBrl,
            binance_buy_brl: this.originalBinanceBuyBrl, // Se guarda la foto de Binance Spot
            binance_sell_bob: null, // Lo dejamos nulo porque BOB es 100% manual estratégico
            notes: `Margen: ${this.profitMarginPct}%`
          }
        ]);

      if (error) throw error;
      alert('✅ Remesa registrada exitosamente en Supabase.');
      
      // Limpiar variables para una nueva operación
      this.targetAmountBob = null;
      this.originalBinanceBuyBrl = null;
      // Mantenemos las tasas en pantalla por si haces otra operación seguida, solo limpiamos el monto
      
    } catch (error: any) {
      console.error('Error:', error.message);
      alert('❌ Error al guardar: ' + error.message);
    }
  }
}