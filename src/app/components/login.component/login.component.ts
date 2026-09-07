import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private supabaseService = inject(SupabaseService);
  
  email = '';
  password = '';
  loading = false;
  errorMsg = '';

  // Iniciar Sesión
  async handleLogin() {
    try {
      this.loading = true;
      this.errorMsg = '';
      const { error } = await this.supabaseService.client.auth.signInWithPassword({
        email: this.email.trim(),
        password: this.password,
      });
      if (error) throw error;
      alert('¡Bienvenido a Renance!');
    } catch (error: any) {
      this.errorMsg = error.message;
    } finally {
      this.loading = false;
    }
  }

  // Registrarse directo desde la app
  async handleRegister() {
    try {
      this.loading = true;
      this.errorMsg = '';
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email: this.email.trim(),
        password: this.password,
      });
      if (error) throw error;
      alert('¡Cuenta creada e iniciada con éxito!');
    } catch (error: any) {
      this.errorMsg = error.message;
    } finally {
      this.loading = false;
    }
  }
}