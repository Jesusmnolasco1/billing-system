import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Inicialización limpia sin la versión explícita
const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { amount, facturaId, customerEmail } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Factura de Servicios`,
              description: `Folio: #${facturaId.split('-')[0]}`
            },
            unit_amount: Math.round(amount * 100), // Stripe requiere el formato en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/factura/${facturaId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/factura/${facturaId}?canceled=true`,
      // Esta es la etiqueta secreta para el Webhook
      metadata: {
        facturaId: facturaId, 
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}