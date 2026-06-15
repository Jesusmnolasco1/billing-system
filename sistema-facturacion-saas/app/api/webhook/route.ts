import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Inicialización limpia sin la versión explícita
const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY!);

// Esta es la contraseña secreta que Stripe nos dará cuando subamos la página a internet
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Falta la firma de Stripe' }, { status: 400 });
  }

  let event;

  try {
    // Validamos que el mensaje realmente viene de Stripe y no de un hacker
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Error de seguridad del Webhook:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Escuchamos el evento específico: "El cliente terminó de pagar con éxito"
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    // Extraemos la etiqueta que le pusimos al crear el pago
    const facturaId = session.metadata?.facturaId;

    if (facturaId) {
      console.log(`💰 ¡Pago recibido para la factura: ${facturaId}! Actualizando base de datos...`);
      
      // Magia pura: Marcamos la factura como Pagada en Supabase automáticamente
      const { error } = await supabase
        .from('facturas')
        .update({ estado: 'Pagada' })
        .eq('id_factura', facturaId);

      if (error) {
        console.error('❌ Error actualizando Supabase:', error.message);
        return NextResponse.json({ error: 'Error en base de datos' }, { status: 500 });
      }

      console.log('✅ Factura actualizada a Pagada exitosamente.');
    }
  }

  // Le respondemos a Stripe que todo salió bien
  return NextResponse.json({ received: true });
}