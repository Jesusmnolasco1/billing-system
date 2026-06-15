// Definición estricta de cómo debe estructurarse un Cliente en nuestro SaaS
export interface Cliente {
  id_cliente: string;
  id_negocio: string; // Conecta al cliente con su profesional independiente
  nombre_contacto: string;
  email_facturacion: string;
}

// Definición estricta de nuestra entidad principal: La Factura
export interface Factura {
  id_factura: string;
  id_negocio: string;
  id_cliente: string;
  monto_total: number; // Usamos number para garantizar que se puedan hacer operaciones matemáticas
  terminos_pago: string;
  fecha_vencimiento: string;
  estado: 'Borrador' | 'Pendiente' | 'Pagada' | 'Vencida'; // Solo permitimos estos 4 estados exactos
  permite_propina: boolean;
}