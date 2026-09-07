import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalculatorComponent } from './components/calculator/calculator.component';
import { LoginComponent } from './components/login.component/login.component';
import { SupabaseService } from './services/supabase';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, CalculatorComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  session: any = null; // Guardará tus datos si estás logueado

  ngOnInit() {
    // 1. Verifica si ya tenías la sesión abierta de antes
    this.supabaseService.client.auth.getSession().then(({ data }) => {
      this.session = data.session;
    });

    // 2. Escucha los cambios (cuando inicias o cierras sesión)
    this.supabaseService.client.auth.onAuthStateChange((_event, session) => {
      this.session = session;
    });
  }
  
  // Función para salir
  logout() {
    this.supabaseService.client.auth.signOut();
  }
}