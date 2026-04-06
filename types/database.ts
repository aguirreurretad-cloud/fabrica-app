export type UserRole = "admin" | "operario" | "vendedor";

export type EstadoPresupuesto = "borrador" | "enviado" | "aprobado" | "rechazado";
export type EstadoPedido = "recibido" | "en_produccion" | "listo" | "enviado" | "entregado";
export type TipoCliente = "mayorista" | "minorista" | "ocasional";
export type TipoMovimiento = "ingreso" | "egreso";

export interface Profile {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  tipo: TipoCliente;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface ProductoVariante {
  id: string;
  producto_id: string;
  talla?: string;
  color?: string;
  stock: number;
  sku?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: string;
  categoria?: Categoria;
  precio_venta: number;
  precio_costo?: number;
  foto_url?: string;
  activo: boolean;
  stock_minimo: number;
  variantes?: ProductoVariante[];
  created_at: string;
  updated_at: string;
}

export interface PresupuestoItem {
  id: string;
  presupuesto_id: string;
  producto_id: string;
  producto?: Producto;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Presupuesto {
  id: string;
  numero: number;
  cliente_id: string;
  cliente?: Cliente;
  estado: EstadoPresupuesto;
  items?: PresupuestoItem[];
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
  notas?: string;
  validez_dias: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  producto?: Producto;
  variante_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  numero: number;
  cliente_id: string;
  cliente?: Cliente;
  presupuesto_id?: string;
  estado: EstadoPedido;
  items?: PedidoItem[];
  total: number;
  fecha_entrega?: string;
  notas?: string;
  asignado_a?: string;
  tracking_number?: string;
  tracking_estado?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  descripcion: string;
  monto: number;
  categoria?: string;
  pedido_id?: string;
  cliente_id?: string;
  fecha: string;
  created_by: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at">; Update: Partial<Profile> };
      clientes: { Row: Cliente; Insert: Omit<Cliente, "id" | "created_at" | "updated_at">; Update: Partial<Cliente> };
      categorias: { Row: Categoria; Insert: Omit<Categoria, "id">; Update: Partial<Categoria> };
      productos: { Row: Producto; Insert: Omit<Producto, "id" | "created_at" | "updated_at">; Update: Partial<Producto> };
      producto_variantes: { Row: ProductoVariante; Insert: Omit<ProductoVariante, "id">; Update: Partial<ProductoVariante> };
      presupuestos: { Row: Presupuesto; Insert: Omit<Presupuesto, "id" | "numero" | "created_at" | "updated_at">; Update: Partial<Presupuesto> };
      presupuesto_items: { Row: PresupuestoItem; Insert: Omit<PresupuestoItem, "id">; Update: Partial<PresupuestoItem> };
      pedidos: { Row: Pedido; Insert: Omit<Pedido, "id" | "numero" | "created_at" | "updated_at">; Update: Partial<Pedido> };
      pedido_items: { Row: PedidoItem; Insert: Omit<PedidoItem, "id">; Update: Partial<PedidoItem> };
      movimientos: { Row: Movimiento; Insert: Omit<Movimiento, "id" | "created_at">; Update: Partial<Movimiento> };
    };
  };
};
