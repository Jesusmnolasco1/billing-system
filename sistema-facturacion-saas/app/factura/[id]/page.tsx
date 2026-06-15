"use client";

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle'; 

export default function PortalPago({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const facturaId = unwrappedParams.id;
  const [factura, setFactura] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarFactura = async () => {
      const { data, error } = await supabase
        .from('facturas')
        .select(`
          *,
          clientes ( nombre_contacto, email_facturacion )
        `)
        .eq('id_factura', facturaId)
        .single();

      if (data) setFactura(data);
      setCargando(false);
    };

    cargarFactura();
  }, [facturaId]);

  const manejarPagoStripe = async () => {
    console.log("Iniciando manejo de pago...");
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: factura.monto_total,
          facturaId: factura.id_factura,
          customerEmail: factura.clientes?.email_facturacion
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error creando sesión de pago: " + data.error);
      }
    } catch (error) {
      console.error("Error completo:", error);
      alert("Error de conexión al procesar el pago");
    }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">Cargando documento...</div>;
  if (!factura) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">Factura no encontrada</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors">
          
          <div className="bg-blue-600 dark:bg-blue-800 px-8 py-10 text-white text-center">
            <h1 className="text-3xl font-black tracking-tight">Factura de Servicios</h1>
            <p className="mt-2 text-blue-100 dark:text-blue-200 text-lg">Folio: #{factura.id_factura.split('-')[0]}</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between mb-10 gap-6">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facturado A</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{factura.clientes?.nombre_contacto}</p>
                <p className="text-gray-600 dark:text-gray-400">{factura.clientes?.email_facturacion}</p>
              </div>
              <div className="md:text-right">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</p>
                <p className="text-gray-800 dark:text-gray-200 mt-1">Vence: <span className="font-semibold">{factura.fecha_vencimiento}</span></p>
                <p className="text-gray-800 dark:text-gray-200">Estado: <span className="font-semibold text-orange-500">{factura.estado}</span></p>
              </div>
            </div>

            {/* NUEVA SECCIÓN: DESCRIPCIÓN / MOTIVO DE LA FACTURA */}
            {factura.descripcion && (
              <div className="mb-10 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Concepto / Motivo de la Factura</p>
                <p className="text-lg text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {factura.descripcion}
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-800 pt-8 mb-10">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Monto Total a Pagar</span>
                <span className="text-4xl font-black text-gray-900 dark:text-white">${factura.monto_total} <span className="text-xl text-gray-500 dark:text-gray-400">USD</span></span>
              </div>
            </div>

            {factura.estado !== 'Pagada' ? (
               <button 
               onClick={manejarPagoStripe}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-5 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-3"
             >
               Pagar Factura Ahora 🔒
             </button>
            ) : (
              <div className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-black text-xl py-5 rounded-xl text-center flex justify-center items-center gap-2 border border-green-200 dark:border-green-800">
                ✅ Esta factura ya fue pagada
              </div>
            )}
            
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 flex justify-center items-center gap-1">
              Pagos procesados de forma 100% segura por Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}