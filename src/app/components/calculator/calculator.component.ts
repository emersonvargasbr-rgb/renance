import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  // NUEVO: Herramienta para forzar a Angular a actualizar la pantalla al instante
  private cdr = inject(ChangeDetectorRef);

  calcMode: 'receive_bob' | 'send_brl' = 'receive_bob';
  
  inputAmount: number | null = null; 
  buyRateBrl: number | null = null;      
  sellRateBob: number | null = null;     
  profitMarginPct: number = 5;           

  // NUEVO: Cuántos Bolivianos le restamos al precio de Yadio por seguridad
  securitySpreadBob: number = 0.50; // Ej: Si Yadio dice 11.50, lo bajará a 11.00

  loadingRates = false;
  originalBinanceBuyBrl: number | null = null;
  originalYadioBob: number | null = null;

  get costPerBrl(): number {
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    return this.sellRateBob / this.buyRateBrl; 
  }

  get costPerBob(): number {
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    return this.buyRateBrl / this.sellRateBob; 
  }

  get calculatedBob(): number {
    if (!this.inputAmount) return 0;
    if (this.calcMode === 'receive_bob') return this.inputAmount;
    
    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    const netBrl = this.inputAmount / (1 + (this.profitMarginPct / 100)); 
    const usdtBought = netBrl / this.buyRateBrl; 
    return usdtBought * this.sellRateBob; 
  }

  get calculatedBrl(): number {
    if (!this.inputAmount) return 0;
    if (this.calcMode === 'send_brl') return this.inputAmount;

    if (!this.buyRateBrl || !this.sellRateBob) return 0;
    const rawCost = this.inputAmount * this.costPerBob;
    return rawCost * (1 + (this.profitMarginPct / 100)); 
  }

  get rawCostBrl(): number {
    return this.calculatedBob * this.costPerBob;
  }

  get netProfitBrl(): number {
    return this.calculatedBrl - this.rawCostBrl;
  }

 async getAutomaticRates() {
    this.loadingRates = true;
    this.cdr.detectChanges(); 

    try {

      const [brlResponse, bobResponse] = await Promise.all([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
        fetch('https://api.yadio.io/exrates/USD') 
      ]);

      // 1. Procesamos el Real (BRL)
      if (brlResponse.ok) {
        const brlData = await brlResponse.json();
        this.buyRateBrl = parseFloat(brlData.price);
        this.originalBinanceBuyBrl = this.buyRateBrl;
      }

      // 2. Procesamos el Boliviano (BOB)
      if (bobResponse.ok) {
        const bobData = await bobResponse.json();
        
        // AQUÍ ESTÁ LA MAGIA: Leemos dentro del objeto "USD" que vimos en tu consola
        const rawBobRate = bobData.USD?.BOB; 
        
        if (rawBobRate) {
          this.originalYadioBob = rawBobRate;
          
          // Aplicamos el spread de seguridad y redondeamos a 2 decimales
          const safeRate = rawBobRate - this.securitySpreadBob;
          this.sellRateBob = Number(safeRate.toFixed(2));
        } 
      }

    } catch (error: any) {
      console.error('Error catastrófico de conexión:', error);
      alert('Hubo un problema de conexión. Revisa los datos.');
    } finally {
      this.loadingRates = false;
      this.cdr.detectChanges(); 
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
            amount_in: this.calculatedBrl, 
            amount_out: this.calculatedBob, 
            exchange_rate: this.costPerBob,   
            fee_amount: 0, 
            net_profit: this.netProfitBrl,
            binance_buy_brl: this.originalBinanceBuyBrl,
            binance_sell_bob: this.originalYadioBob, 
            notes: `Margen: ${this.profitMarginPct}% | Modo: ${this.calcMode} | Spread BOB: -${this.securitySpreadBob}`
          }
        ]);

      if (error) throw error;
      alert('Remesa registrada exitosamente.');
      
      this.inputAmount = null;
      this.originalBinanceBuyBrl = null;
      this.originalYadioBob = null;
      
    } catch (error: any) {
      console.error('Error:', error.message);
      alert('Error al guardar: ' + error.message);
    }
  }
}