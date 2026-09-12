import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-smm-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smm-panel.component.html'
})
export class SmmPanelComponent {
  // Estado visual
  selectedNetwork: 'instagram' | 'tiktok' | 'youtube' = 'instagram';
  selectedType: 'followers' | 'likes' | 'views' = 'followers';
  
  // Datos del pedido
  targetUrl: string = '';
  selectedPack: any = null;

  // Mock Data: Catálogo de paquetes para inspirar la UI
  // En el futuro, esto vendrá de tu base de datos o de la API de tu proveedor
  packages = {
    instagram: {
      followers: [
        { id: 1, amount: 1000, priceBrl: 4.50, speed: 'Rápido', quality: 'Alta Calidad' },
        { id: 2, amount: 5000, priceBrl: 21.00, speed: 'Rápido', quality: 'Alta Calidad' },
        { id: 3, amount: 10000, priceBrl: 40.00, speed: 'Medio', quality: 'Reales / Garantía 30d' }
      ],
      likes: [
        { id: 4, amount: 500, priceBrl: 1.20, speed: 'Instantáneo', quality: 'Mundial' },
        { id: 5, amount: 1000, priceBrl: 2.00, speed: 'Instantáneo', quality: 'Mundial' }
      ]
    },
    tiktok: {
      followers: [
        { id: 6, amount: 1000, priceBrl: 6.00, speed: 'Lento', quality: 'Mixto' }
      ]
    }
  };

  // Obtiene los paquetes disponibles según lo que el usuario seleccionó
  get currentPacks() {
    // @ts-ignore
    return this.packages[this.selectedNetwork]?.[this.selectedType] || [];
  }

  selectPack(pack: any) {
    this.selectedPack = pack;
  }

  processOrder() {
    if (!this.targetUrl || !this.selectedPack) {
      alert('Por favor ingresa el link y selecciona un paquete.');
      return;
    }
    // Aquí irá la lógica de Supabase y la Edge Function en el futuro
    alert(`🚀 Simulando envío de ${this.selectedPack.amount} ${this.selectedType} a ${this.targetUrl} por R$ ${this.selectedPack.priceBrl}`);
    this.targetUrl = '';
    this.selectedPack = null;
  }
}