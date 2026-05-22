'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { TaxService } from '@/features/taxes/taxes.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Euro, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Calendar,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaxProjection {
  id: string;
  vat_estimate: number;
  quarterly_estimate: number;
  annual_projection: number;
  last_updated: string;
  status: 'draft' | 'calculated' | 'filed' | 'paid';
}

interface TaxSettings {
  tax_rate: number;
  vat_rate: number;
  fiscal_regime: string;
  country: string;
}

export default function TaxesPage() {
  const [projection, setProjection] = useState<TaxProjection | null>(null);
  const [settings, setSettings] = useState<TaxSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const supabase = createClientComponentClient();
  const taxService = new TaxService(supabase);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [proj, sett] = await Promise.all([
        taxService.getCurrentProjection(),
        taxService.getSettings()
      ]);
      setProjection(proj);
      setSettings(sett);
    } catch (error) {
      console.error('Error fetching tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await taxService.calculateProjections();
      await fetchData();
    } catch (error) {
      console.error('Error calculating projections:', error);
      alert('Error al calcular las proyecciones. Inténtalo de nuevo.');
    } finally {
      setCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      calculated: 'default',
      filed: 'secondary',
      paid: 'default', // Green handled by icon
      draft: 'outline',
    };
    
    const icons: Record<string, any> = {
      calculated: <TrendingUp className="w-3 h-3 mr-1" />,
      filed: <FileText className="w-3 h-3 mr-1" />,
      paid: <CheckCircle className="w-3 h-3 mr-1" />,
      draft: <AlertCircle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize flex items-center w-fit">
        {icons[status]}
        {status === 'paid' ? 'Pagado' : 
         status === 'filed' ? 'Presentado' : 
         status === 'calculated' ? 'Calculado' : 'Borrador'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impuestos</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus obligaciones fiscales y proyecciones</p>
        </div>
        <Button onClick={handleCalculate} disabled={calculating}>
          {calculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Recalcular Proyecciones
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IVA a Pagar (Estimado)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projection ? formatCurrency(projection.vat_estimate) : '€0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basado en transacciones del trimestre actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impuesto Trimestral</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projection ? formatCurrency(projection.quarterly_estimate) : '€0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Proyección para el cierre del trimestre
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyección Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projection ? formatCurrency(projection.annual_projection || 0) : '€0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimación basada en el ritmo actual
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Estado Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de la Declaración</CardTitle>
            <CardDescription>Situación fiscal del periodo actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projection ? (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Periodo Actual</p>
                  <p className="text-xs text-muted-foreground">
                    Actualizado: {format(new Date(projection.last_updated), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
                {getStatusBadge(projection.status)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay proyecciones calculadas</p>
                <p className="text-xs">Haz clic en "Recalcular Proyecciones" para comenzar</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Desglose Estimado</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Imponible</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA Repercutido</span>
                  <span className="font-medium text-green-600">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA Soportado</span>
                  <span className="font-medium text-red-600">--</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span>A Pagar / A Devolver</span>
                  <span>{projection ? formatCurrency(projection.vat_estimate) : '€0.00'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración Fiscal */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración Fiscal</CardTitle>
            <CardDescription>Parámetros para el cálculo de impuestos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span className="text-sm text-muted-foreground">Régimen Fiscal</span>
                  <Badge variant="outline">{settings.fiscal_regime}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span className="text-sm text-muted-foreground">Tipo de IVA</span>
                  <span className="font-medium">{(settings.vat_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span className="text-sm text-muted-foreground">Tipo de Impuesto</span>
                  <span className="font-medium">{(settings.tax_rate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
                  <span className="text-sm text-muted-foreground">País</span>
                  <span className="font-medium capitalize">{settings.country}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Configuración no disponible</p>
                <p className="text-xs">Contacta con soporte para configurar tu perfil fiscal</p>
              </div>
            )}
            
            <Button variant="outline" className="w-full mt-4" disabled>
              Editar Configuración (Próximamente)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Vencimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario Fiscal</CardTitle>
          <CardDescription>Próximas fechas de presentación y pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { concept: 'Declaración IVA - Q1', date: '2024-04-20', type: 'vat' },
              { concept: 'Pago Fraccionado IRPF', date: '2024-04-20', type: 'irpf' },
              { concept: 'Declaración IVA - Q2', date: '2024-07-20', type: 'vat' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${item.type === 'vat' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.concept}</p>
                    <p className="text-xs text-muted-foreground">Presentación telemática</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {format(new Date(item.date), 'dd MMM yyyy', { locale: es })}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">Pendiente</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
