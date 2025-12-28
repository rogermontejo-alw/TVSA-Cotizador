# Plan de Migración: Cotizador Televisa MID a Supabase CRM

Este documento detalla la hoja de ruta para transformar el Cotizador basado en Google Sheets en un sistema de gestión integral (CRM/ERP) utilizando Supabase.

## 1. Diseño de la Base de Datos (SQL Schema)

Este esquema soporta Clientes, Master Contracts, Cotizaciones (Pipeline), Facturación y Tareas.

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: CLIENTES
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_empresa TEXT NOT NULL,
    nombre_contacto TEXT,
    email TEXT,
    telefono TEXT,
    direccion_completa TEXT,
    tipo TEXT CHECK (tipo IN ('prospecto', 'curso', 'cliente')) DEFAULT 'prospecto',
    estatus TEXT CHECK (estatus IN ('activo', 'inactivo')) DEFAULT 'activo',
    notas_generales TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: PRODUCTOS (Tarifario Maestro)
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canal TEXT NOT NULL,
    plaza TEXT NOT NULL,
    tipo TEXT NOT NULL,
    horario TEXT NOT NULL,
    costo_base DECIMAL(12, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: MASTER CONTRACTS (Bolsas de Crédito)
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

-- 4. TABLA: COTIZACIONES (Pipeline de Ventas)
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
    json_detalles JSONB NOT NULL, -- Datos técnicos de la cotización
    fecha_estimada_cierre DATE,
    fecha_cierre_real DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA: FACTURACION Y COBRANZA
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

-- 6. TABLA: TAREAS Y RECORDATORIOS
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
```

## 2. Hoja de Ruta de Implementación

### Fase 1: Entorno y Datos (Semana 1)
1.  **Configuración de Supabase**: Creación del proyecto y ejecución del script SQL anterior.
2.  **Migración de Datos Existentes**: Script manual para subir los clientes y cotizaciones actuales desde Google Sheets a las nuevas tablas.
3.  **Nueva Capa de Datos**: Creación de `src/lib/supabase.js` y el hook `useDatabase.js`.

### Fase 2: CRM y Master Contracts (Semana 1-2)
1.  **Dashboard de Clientes v2**: Rediseño de la administración para ver la ficha completa.
2.  **Módulo Master Contracts**: Interfaz para crear y monitorear el consumo de los MC.
3.  **Gestor de Tareas**: Panel de "Hoy" con alertas visuales.

### Fase 3: Pipeline y Finanzas (Semana 2-3)
1.  **Pipeline View**: Vista de Kanban o Lista con cambios de estatus (Ganada/Perdida).
2.  **Módulo Cobranza**: Subida de PDFs de facturas y gestión de fechas de cobro.
3.  **Reportería**: Generación de informes exportables filtrados por fecha y estatus.

## 3. Consideraciones Técnicas
- **Seguridad**: Se implementarán Row Level Security (RLS) para proteger datos sensibles.
- **Offline First**: Se cachearán los datos básicos (productos) para asegurar la velocidad de cotización.
- **Transición**: Durante la migración, la App tendrá un interruptor de "Legacy Mode" para consultar Sheets en caso de emergencia.
