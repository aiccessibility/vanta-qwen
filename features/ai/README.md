# AI Transaction Categorization Module

## Overview
Módulo completo de categorización automática de transacciones utilizando IA (OpenAI GPT-4) con aprendizaje contextual y feedback del usuario.

## Características Principales

### 1. **Categorización Automática** 🤖
- Análisis inteligente de transacciones bancarias usando GPT-4o-mini
- Clasificación en categorías fiscales estándar (ingresos/gastos)
- Detección automática del tipo de proveedor/comerciante
- Cálculo estimado de IVA según categoría

### 2. **Detección de Proveedores** 🏪
- Identificación del tipo de comercio (SaaS, retail, restaurante, etc.)
- Extracción de información fiscal del proveedor
- Evaluación de riesgo basada en patrones históricos

### 3. **Clasificación Fiscal** 📊
- Tratamiento fiscal: deducible, no deducible, parcialmente deducible
- Cálculo automático de IVA aplicable
- Integración con módulos de impuestos para proyecciones

### 4. **Aprendizaje Contextual** 🧠
- Historial de categorizaciones previas como contexto
- Categorías personalizadas por organización
- Feedback del usuario para mejora continua
- Registro de eventos de aprendizaje en `ai_events`

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  TransactionCategorizer Component                    │   │
│  │  - Muestra resumen de transacción                    │   │
│  │  - Botón "Categorizar con IA"                        │   │
│  │  - Visualiza resultado con confianza                 │   │
│  │  - Permite feedback manual                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useTransactionCategorization Hook                   │   │
│  │  - Gestiona estado de categorización                 │   │
│  │  - Maneja errores                                    │   │
│  │  - Cache de resultados                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ API REST (/api/transactions/[id]/categorize)
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  transaction-categorization.service.ts               │   │
│  │  - categorizeTransactionWithAI()                     │   │
│  │  - extractMerchantInfo()                             │   │
│  │  - buildContextualPrompt()                           │   │
│  │  - recategorizeWithFeedback()                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   OpenAI    │ │  Supabase   │ │  Learning   │           │
│  │   GPT-4o    │ │   Database  │ │   Events    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Archivos Implementados

### Validadores y Tipos
- `/lib/validators/transaction-categorization.ts` - Esquemas Zod y tipos
- `/types/categorization.ts` - Tipos para API responses

### Servicios
- `/features/ai/transaction-categorization.service.ts` - Lógica principal de IA
- `/services/supabase/categorization.ts` - Funciones de base de datos

### Hooks
- `/hooks/use-transaction-categorization.ts` - Hook React para UI

### Componentes
- `/components/transactions/transaction-categorizer.tsx` - Componente UI completo

### API Routes
- `/app/api/transactions/[id]/categorize/route.ts` - Endpoints GET/POST/PUT

### Base de Datos
- `/supabase/migrations/006_transaction_categorization.sql` - Tablas y políticas

## Uso

### Desde el Frontend

```tsx
import { TransactionCategorizer } from '@/components/transactions/transaction-categorizer';

<TransactionCategorizer
  organizationId={orgId}
  userId={userId}
  transaction={{
    id: 'uuid',
    amount: -150.00,
    currency: 'EUR',
    description: 'Pago con tarjeta',
    merchantName: 'Amazon EU',
    timestamp: '2024-01-15T10:30:00Z',
    bankAccountId: 'uuid',
  }}
  onCategorized={(result) => {
    console.log('Categorizado:', result.categoryName);
  }}
/>
```

### Usando el Hook

```tsx
import { useTransactionCategorization } from '@/hooks/use-transaction-categorization';

const { categorizeTransaction, recategorize, lastResult } = 
  useTransactionCategorization({ organizationId, userId });

const result = await categorizeTransaction({
  transaction: { ... },
  includeAlternatives: true,
  useHistoricalContext: true,
});
```

### API Directa

```bash
# Obtener sugerencia de categorización
GET /api/transactions/{id}/categorize?includeAlternatives=true

# Aplicar categorización
POST /api/transactions/{id}/categorize
{
  "includeAlternatives": false,
  "useHistoricalContext": true
}

# Enviar feedback manual
PUT /api/transactions/{id}/feedback
{
  "newCategory": "software_subscriptions",
  "reason": "Es una suscripción de software mensual"
}
```

## Categorías Soportadas

### Gastos
- `office_supplies` - Suministros de oficina
- `software_subscriptions` - Software y SaaS
- `professional_services` - Servicios profesionales
- `marketing_advertising` - Marketing y publicidad
- `travel_transportation` - Viajes y transporte
- `meals_entertainment` - Comidas y entretenimiento
- `utilities` - Suministros (luz, agua, gas)
- `rent_leases` - Alquileres
- `insurance` - Seguros
- `bank_fees` - Comisiones bancarias
- `equipment_hardware` - Equipamiento y hardware
- `telecommunications` - Telecomunicaciones
- `maintenance_repairs` - Mantenimiento y reparaciones
- `contractors_freelancers` - Autónomos y contractors

### Ingresos
- `product_sales` - Ventas de productos
- `service_revenue` - Ingresos por servicios
- `subscription_revenue` - Suscripciones recurrentes
- `consulting_income` - Ingresos por consultoría
- `commission_income` - Comisiones
- `investment_income` - Ingresos por inversiones

## Aprendizaje y Mejora Continua

El sistema mejora con cada interacción:

1. **Histórico**: Usa transacciones previas del mismo proveedor como referencia
2. **Feedback**: Guarda correcciones manuales para futuros casos similares
3. **Eventos AI**: Registra todos los eventos en `ai_events` para análisis
4. **Categorías Personalizadas**: Permite a cada organización definir sus propias categorías

## Configuración Requerida

### Variables de Entorno
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Migraciones
Ejecutar en Supabase:
```bash
supabase db push # O aplicar manualmente 006_transaction_categorization.sql
```

## Métricas y Monitoreo

El sistema proporciona:
- **Confidence Score**: 0-1 indicando certeza de la categorización
- **Needs Review**: Flag para transacciones que requieren revisión manual
- **Alternative Categories**: Sugerencias secundarias con sus confianzas
- **Reasoning**: Explicación detallada de la decisión de la IA

## Seguridad

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Validación de permisos por organización
- ✅ Solo miembros pueden ver/categorizar transacciones de su org
- ✅ Audit trail completo en `audit_logs` y `ai_events`

## Próximas Mejoras

- [ ] Batch processing para múltiples transacciones
- [ ] Entrenamiento de modelo fine-tuned específico para finanzas
- [ ] Detección de fraudes basada en anomalías
- [ ] Integración con documentos OCR para validación cruzada
- [ ] Exportación de reportes de categorización
