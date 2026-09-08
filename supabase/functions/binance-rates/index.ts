import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // 1. Manejo del Preflight de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const fetchBinanceP2P = async (fiat: string, tradeType: string) => {
      const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // DISFRAZ: Le decimos a Binance que somos un navegador Chrome en Windows
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          page: 1,
          rows: 1, 
          asset: "USDT",
          tradeType: tradeType,
          fiat: fiat,
          publisherType: null 
        })
      });

      if (!response.ok) {
        throw new Error(`Binance bloqueó la petición con status: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificamos si Binance nos devolvió la estructura correcta
      if (!data || !data.data || data.data.length === 0) {
        throw new Error(`Binance no devolvió anuncios para ${fiat}. Respuesta: ${JSON.stringify(data)}`);
      }

      return parseFloat(data.data[0].adv.price);
    };

    const [buyBrl, sellBob] = await Promise.all([
      fetchBinanceP2P("BRL", "BUY"),
      fetchBinanceP2P("BOB", "SELL")
    ]);

    return new Response(
      JSON.stringify({ buyBrl, sellBob }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    // Ahora si falla, enviamos el motivo exacto al frontend
    console.error("Error interno:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})