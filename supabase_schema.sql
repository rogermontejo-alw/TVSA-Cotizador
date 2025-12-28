-- SCRIPT DE INICIALIZACIÓN: CRM TELEVISA MID

-- LIMPIEZA TOTAL (Opcional, útil para reinicializar)
DROP VIEW IF EXISTS vista_resumen_mc;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS cobranza CASCADE;
DROP TABLE IF EXISTS cotizacion_items CASCADE;
DROP TABLE IF EXISTS cotizaciones CASCADE;
DROP TABLE IF EXISTS condiciones_cliente CASCADE;
DROP TABLE IF EXISTS master_contracts CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS paquetes_vix CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_empresa TEXT NOT NULL UNIQUE,
    nombre_contacto TEXT,
    email TEXT,
    telefono TEXT,
    direccion_completa TEXT,
    plaza TEXT DEFAULT 'MERIDA',
    segmento TEXT DEFAULT 'PYME',
    tipo_acuerdo TEXT DEFAULT 'SIN_ACUERDO',
    etapa TEXT CHECK (etapa IN ('Prospecto', 'Contactado', 'Cliente')) DEFAULT 'Prospecto',
    tipo TEXT CHECK (tipo IN ('prospecto', 'curso', 'cliente')) DEFAULT 'prospecto',
    estatus TEXT CHECK (estatus IN ('activo', 'inactivo')) DEFAULT 'activo',
    notas_generales TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Descuentos por Volumen (Opcional pero recomendado para automatización)
CREATE TABLE descuentos_volumen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria TEXT NOT NULL,
    cantidad_minima INTEGER NOT NULL,
    descuento_porcentaje DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Productos (Tarifario Maestro)
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canal TEXT NOT NULL,
    plaza TEXT NOT NULL,
    tipo TEXT NOT NULL,
    duracion TEXT,
    horario TEXT NOT NULL,
    costo_base DECIMAL(12, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(canal, plaza, tipo, duracion, horario)
);

-- 4. Master Contracts (Bolsas de Crédito)
CREATE TABLE master_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    numero_mc TEXT NOT NULL UNIQUE,
    monto_aprobado DECIMAL(14, 2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    notas TEXT,
    estatus TEXT CHECK (estatus IN ('activo', 'agotado', 'vencido')) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Cotizaciones (Pipeline)
CREATE TABLE cotizaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    mc_id UUID REFERENCES master_contracts(id) ON DELETE SET NULL,
    folio TEXT UNIQUE NOT NULL,
    estatus TEXT CHECK (estatus IN ('borrador', 'enviada', 'negociacion', 'ganada', 'perdida')) DEFAULT 'borrador',
    probabilidad_cierre INTEGER CHECK (probabilidad_cierre BETWEEN 0 AND 100),
    monto_total DECIMAL(14, 2) NOT NULL,
    dias_campana INTEGER DEFAULT 30,
    paquete_vix BOOLEAN DEFAULT FALSE,
    json_detalles JSONB NOT NULL,
    fecha_estimada_cierre DATE,
    fecha_cierre_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Cobranza y Facturación
CREATE TABLE cobranza (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
    numero_factura TEXT,
    url_archivo_pdf TEXT,
    monto_facturado DECIMAL(14, 2) NOT NULL,
    fecha_programada_cobro DATE,
    fecha_cobro_real DATE,
    estatus_pago TEXT CHECK (estatus_pago IN ('pendiente', 'programado', 'cobrado', 'vencido')) DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tareas y Agenda
CREATE TABLE tareas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    prioridad TEXT CHECK (prioridad IN ('baja', 'media', 'alta')) DEFAULT 'media',
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Paquetes VIX
CREATE TABLE paquetes_vix (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    inversion DECIMAL(14, 2) NOT NULL,
    dias INTEGER NOT NULL,
    impresiones INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Configuración Global
CREATE TABLE configuracion (
    parametro TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('TEXTO', 'NUMERO')) DEFAULT 'TEXTO',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Condiciones Personalizadas por Cliente
CREATE TABLE condiciones_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    tipo_ajuste TEXT CHECK (tipo_ajuste IN ('FACTOR', 'FIJO')) DEFAULT 'FACTOR',
    factor_descuento DECIMAL(5, 4),
    costo_fijo DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cliente_id, producto_id)
);

-- 8. Metas Comerciales
CREATE TABLE metas_comerciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    anio INTEGER NOT NULL,
    monto_meta DECIMAL(14, 2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mes, anio)
);

-- VISTAS ÚTILES PARA REPORTES

-- Vista de Consumo de Master Contracts
CREATE OR REPLACE VIEW vista_resumen_mc AS
SELECT 
    mc.id,
    mc.numero_mc,
    c.nombre_empresa,
    mc.monto_aprobado,
    COALESCE(SUM(co.monto_total) FILTER (WHERE co.estatus = 'ganada'), 0) as monto_consumido,
    mc.monto_aprobado - COALESCE(SUM(co.monto_total) FILTER (WHERE co.estatus = 'ganada'), 0) as saldo_disponible
FROM master_contracts mc
JOIN clientes c ON mc.cliente_id = c.id
LEFT JOIN cotizaciones co ON mc.id = co.mc_id
GROUP BY mc.id, c.nombre_empresa;
