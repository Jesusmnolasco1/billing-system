"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import CreadorFacturasWizard from '@/components/CreadorFacturasWizard';
import ThemeToggle from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';

type Factura = {
  id_factura: string;
  monto_total: number;
  estado: string;
  fecha_vencimiento: string;
  descripcion?: string; 
  clientes: { nombre_contacto: string } | null;
};

export default function Dashboard() {
  const router = useRouter();

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [totalFacturado, setTotalFacturado] = useState(0);
  const [porCobrar, setPorCobrar] = useState(0);
  const [mostrarWizard, setMostrarWizard] = useState(false);

  const [facturaEditando, setFacturaEditando] = useState<Factura | null>(null);
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editMonto, setEditMonto] = useState(0);
  const [editFecha, setEditFecha] = useState('');

  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroMonto, setFiltroMonto] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  useEffect(() => {
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    verificarSesion();
  }, [router]);

  const cargarDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Si no hay sesion, no cargamos nada

    const { data, error } = await supabase
      .from('facturas')
      .select(`
        id_factura,
        monto_total,
        estado,
        fecha_vencimiento,
        descripcion,
        clientes ( nombre_contacto )
      `)
      .eq('id_usuario', session.user.id) // <- EL FILTRO DE SEGURIDAD
      .order('fecha_vencimiento', { ascending: false });

    if (error) {
      console.error("El error real es:", error.message, error.details, error.hint); // <-- Modificado
      alert("Error de Supabase: " + error.message); // <-- Añadimos una alerta visual
      return;
    }

    if (data) {
      const facturasFormateadas = data as unknown as Factura[];
      setFacturas(facturasFormateadas);

      const total = facturasFormateadas.reduce((sum, f) => sum + Number(f.monto_total), 0);
      setTotalFacturado(total);

      const pendiente = facturasFormateadas
        .filter(f => f.estado !== 'Pagada')
        .reduce((sum, f) => sum + Number(f.monto_total), 0);
      setPorCobrar(pendiente);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const marcarComoPagada = async (id_factura: string) => {
    const { error } = await supabase
      .from('facturas')
      .update({ estado: 'Pagada' })
      .eq('id_factura', id_factura);

    if (error) alert("Error al actualizar la factura");
    else cargarDashboard(); 
  };

  const abrirModalEdicion = (factura: Factura) => {
    setFacturaEditando(factura);
    setEditDescripcion(factura.descripcion || '');
    setEditMonto(factura.monto_total);
    setEditFecha(factura.fecha_vencimiento);
  };

  const guardarEdicion = async () => {
    if (!facturaEditando) return;
    
    const { error } = await supabase
      .from('facturas')
      .update({ 
        descripcion: editDescripcion, 
        monto_total: editMonto, 
        fecha_vencimiento: editFecha 
      })
      .eq('id_factura', facturaEditando.id_factura);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setFacturaEditando(null); 
      cargarDashboard(); 
    }
  };

  const facturasFiltradas = useMemo(() => {
    return facturas.filter((factura) => {
      const nombreCliente = factura.clientes?.nombre_contacto?.toLowerCase() || '';
      const coincideNombre = nombreCliente.includes(filtroNombre.toLowerCase());
      const coincideMonto = filtroMonto === '' || factura.monto_total.toString().includes(filtroMonto);
      const coincideFecha = filtroFecha === '' || factura.fecha_vencimiento === filtroFecha;

      return coincideNombre && coincideMonto && coincideFecha;
    });
  }, [facturas, filtroNombre, filtroMonto, filtroFecha]);


  if (mostrarWizard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="p-4 max-w-5xl mx-auto">
          <button 
            onClick={() => {
              setMostrarWizard(false);
              cargarDashboard();
            }}
            className="mb-4 text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-2"
          >
            Volver al Dashboard Financiero
          </button>
        </div>
        <CreadorFacturasWizard />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 p-4 md:p-8 relative">
      
      {facturaEditando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800">
            <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white">Editar Factura</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Motivo / Descripcion</label>
                <textarea
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Monto Total ($)</label>
                  <input
                    type="number"
                    value={editMonto}
                    onChange={(e) => setEditMonto(Number(e.target.value))}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setFacturaEditando(null)} 
                className="px-5 py-2.5 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={guardarEdicion} 
                className="px-5 py-2.5 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Financiero</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-semibold px-4 transition"
            >
              Cerrar Sesion
            </button>

            <button 
              onClick={() => setMostrarWizard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition"
            >
              + Crear Nueva Factura
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">Total Facturado</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white mt-2">${totalFacturado.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase">Por Cobrar</p>
            <p className="text-4xl font-black text-orange-500 mt-2">${porCobrar.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
          
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Buscar por Cliente..." 
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <input 
                type="number" 
                placeholder="Monto..." 
                value={filtroMonto}
                onChange={(e) => setFiltroMonto(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-28 transition-colors"
              />
              <input 
                type="date" 
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              {(filtroNombre || filtroMonto || filtroFecha) && (
                <button 
                  onClick={() => { setFiltroNombre(''); setFiltroMonto(''); setFiltroFecha(''); }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-semibold"
                  title="Limpiar filtros"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {facturasFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No se encontraron facturas con esos criterios.</p>
                {facturas.length === 0 && <p className="text-sm mt-2 text-gray-400">¡Crea tu primera factura!</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {facturasFiltradas.map((factura) => (
                  <div key={factura.id_factura} className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl gap-4 border border-transparent hover:border-gray-200 dark:border-gray-700 transition-all">
                    
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {factura.clientes?.nombre_contacto || 'Cliente Desconocido'}
                      </p>
                      
                      {factura.descripcion && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                          "{factura.descripcion}"
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vence: {factura.fecha_vencimiento}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-white text-lg mr-2">
                        ${Number(factura.monto_total).toFixed(2)}
                      </p>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        factura.estado === 'Pagada' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {factura.estado}
                      </span>

                      <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 select-all cursor-copy" title="Haz clic para copiar todo el ID">
                          {factura.id_factura}
                        </span>
                      </div>

                      <a
                        href={`/factura/${factura.id_factura}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                      >
                        Ver Detalle
                      </a>

                      <button
                        onClick={() => abrirModalEdicion(factura)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                      >
                        Editar
                      </button>

                      {factura.estado !== 'Pagada' && (
                        <button
                          onClick={() => marcarComoPagada(factura.id_factura)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition shadow-sm"
                        >
                          Cobrar
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}