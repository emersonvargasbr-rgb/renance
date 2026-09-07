import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // IMPORTANTE: Pega aquí tus credenciales de Supabase
private supabaseUrl = 'https://eqmeiyzwcvgosougmfie.supabase.co';
  private supabaseKey = 'sb_publishable_QwXo1bcWh0IVdTvQWKHXNw_G_1W89E1';

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // Método para exponer el cliente de Supabase
  get client() {
    return this.supabase;
  }
}