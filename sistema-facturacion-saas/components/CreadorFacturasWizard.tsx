"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CreadorFacturasWizard() {
  const [paso, setPaso] = useState(1);

  // Estados del Paso 1
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Estados del Paso 2 (Los inputs de cantidad y precio ahora empiezan como strings vacíos para mejor UX, pero se calcularán como números)
  const [lineas, setLineas] = useState([{ concepto: '', cantidad: '1', precio: '' }]);

  // Estados del Paso 3
  const [terminosPago, setTerminosPago] = useState('Net 30');
  const [permitePropina, setPermitePropina] = useState(false);

  const paso1Valido = clienteNombre.trim() !== '' && clienteEmail.trim() !== '';

  const calcularSubtotal = () => {
    return lineas.reduce((total, linea) => {
      const cant = Number(linea.cantidad) || 0;
      const prec = Number(linea.precio) || 0;
      return total + (cant * prec);
    }, 0);
  };

  const paso2Valido = lineas.every(l => l.concepto.trim() !== '' && Number(l.precio) > 0) && calcularSubtotal() > 0;

  const eliminarLinea = (indexToRemove: number) => {
    if (lineas.length > 1) {
      const nuevasLineas = lineas.filter((_, index) => index !== indexToRemove);
      setLineas(nuevasLineas);
    }
  };

  const manejarEnvioFactura = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sesion expirada. Por favor, inicia sesion nuevamente.");
        return;
      }
      const userId = session.user.id;

      const { data: cliente, error: errorCliente } = await supabase
        .from('clientes')
        .insert([
          { 
            nombre_contacto: clienteNombre, 
            email_facturacion: clienteEmail,
            id_usuario: userId 
          }
        ])
        .select()
        .single();
  
      if (errorCliente) throw errorCliente;
  
      const fechaHoy = new Date();
      const diasPlazo = parseInt(terminosPago.replace('Net ', '')) || 0;
      fechaHoy.setDate(fechaHoy.getDate() + diasPlazo);
      const fechaVencimiento = fechaHoy.toISOString().split('T')[0];
  
      const { error: errorFactura } = await supabase
        .from('facturas')
        .insert([
          { 
            id_usuario: userId,
            id_cliente: cliente.id_cliente,
            monto_total: calcularSubtotal(),
            terminos_pago: terminosPago,
            fecha_vencimiento: fechaVencimiento,
            descripcion: descripcion,
            estado: 'Borrador'
          }
        ]);
  
      if (errorFactura) throw errorFactura;
  
      alert("Exito Total: La factura ya esta guardada en tu cuenta de forma segura.");
      window.location.reload();
      
    } catch (error: any) {
      alert("Hubo un problema con Supabase: " + error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 max-w-2xl mx-auto transition-colors duration-300">
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Crear Nueva Factura</h2>
        <p className="text-gray-500 dark:text-gray-400">Paso {paso} de 4</p>
        
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full mt-4 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${(paso / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {paso === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Detalles Principales</h3>
          
          <div className="space-y-4 border border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Contacto o Empresa</label>
              <input 
                type="text" 
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Ej. Empresa Acme S.A."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Correo Electronico</label>
              <input 
                type="email" 
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="facturacion@acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Motivo / Descripcion de la Factura</label>
              <textarea 
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Ej. Pago correspondiente a la consultoria del mes de Julio."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={() => setPaso(2)}
              disabled={!paso1Valido}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                paso1Valido 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Siguiente: Agregar Servicios
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Servicios a Cobrar</h3>
          <div className="space-y-4">
            {lineas.map((linea, index) => (
              <div key={index} className="flex gap-4 items-start bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Concepto</label>
                  <input 
                    type="text" 
                    value={linea.concepto}
                    onChange={(e) => {
                      const nuevasLineas = [...lineas];
                      nuevasLineas[index].concepto = e.target.value;
                      setLineas(nuevasLineas);
                    }}
                    placeholder="Ej. Diseno de Logotipo"
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Cant.</label>
                  <input 
                    type="number" 
                    min="1"
                    value={linea.cantidad}
                    onChange={(e) => {
                      const nuevasLineas = [...lineas];
                      nuevasLineas[index].cantidad = e.target.value; // Guardamos como texto para evitar el 0 inicial
                      setLineas(nuevasLineas);
                    }}
                    onBlur={(e) => {
                      // Si el usuario lo deja en blanco al salir, lo forzamos a '1'
                      if (e.target.value === '' || Number(e.target.value) <= 0) {
                        const nuevasLineas = [...lineas];
                        nuevasLineas[index].cantidad = '1';
                        setLineas(nuevasLineas);
                      }
                    }}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Precio ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={linea.precio}
                    onChange={(e) => {
                      const nuevasLineas = [...lineas];
                      nuevasLineas[index].precio = e.target.value; // Guardamos como texto
                      setLineas(nuevasLineas);
                    }}
                    onBlur={(e) => {
                      // Si lo deja en blanco, lo volvemos '0' al salir
                      if (e.target.value === '') {
                        const nuevasLineas = [...lineas];
                        nuevasLineas[index].precio = '0';
                        setLineas(nuevasLineas);
                      }
                    }}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                
                {lineas.length > 1 && (
                  <div className="pt-6">
                    <button 
                      onClick={() => eliminarLinea(index)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar linea"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <button 
              onClick={() => setLineas([...lineas, { concepto: '', cantidad: '1', precio: '' }])}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              + Agregar otra linea
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de la Factura</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">${calcularSubtotal().toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button 
              onClick={() => setPaso(1)}
              className="px-6 py-3 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Volver
            </button>
            <button 
              onClick={() => setPaso(3)}
              disabled={!paso2Valido}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                paso2Valido 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Siguiente: Terminos
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Condiciones y Extras</h3>
          <div className="space-y-6 border border-gray-200 dark:border-gray-700 p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Terminos de Pago</label>
              <select 
                value={terminosPago}
                onChange={(e) => setTerminosPago(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="De contado">De contado (Due on receipt)</option>
                <option value="Net 15">Net 15 (Vence en 15 dias)</option>
                <option value="Net 30">Net 30 (Vence en 30 dias)</option>
                <option value="Net 60">Net 60 (Vence en 60 dias)</option>
              </select>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Aceptar Propinas</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permite que el cliente agregue un extra al pagar.</p>
              </div>
              <button 
                onClick={() => setPermitePropina(!permitePropina)}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${
                  permitePropina ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  permitePropina ? 'translate-x-6' : 'translate-x-0'
                }`}></div>
              </button>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setPaso(2)} className="px-6 py-3 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Volver</button>
            <button onClick={() => setPaso(4)} className="px-6 py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all">Revisar Documento</button>
          </div>
        </div>
      )}

      {paso === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Revision Final</h3>
          <div className="border border-gray-200 dark:border-gray-700 p-8 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Facturar A</p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{clienteNombre}</p>
                <p className="text-gray-600 dark:text-gray-400">{clienteEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Terminos</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{terminosPago}</p>
              </div>
            </div>
            
            {descripcion && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Motivo / Detalle</p>
                <p className="text-gray-800 dark:text-gray-200 italic">"{descripcion}"</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {lineas.map((linea, i) => (
                <div key={i} className="flex justify-between text-gray-800 dark:text-gray-200">
                  <p><span className="text-gray-400 dark:text-gray-500">{Number(linea.cantidad)}x</span> {linea.concepto}</p>
                  <p className="font-semibold">${(Number(linea.cantidad) * Number(linea.precio)).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-6">
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {permitePropina ? 'Incluye opcion de propina' : ''}
              </p>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Total a Cobrar</p>
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400">${calcularSubtotal().toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setPaso(3)} className="px-6 py-3 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Editar</button>
            <button onClick={manejarEnvioFactura} className="px-8 py-3 rounded-lg font-black bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 transition-all">Generar y Enviar Factura</button>
          </div>
        </div>
      )}
    </div>
  );
}