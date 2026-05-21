'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Brain, TrendingUp, Receipt } from 'lucide-react';
import type { AICategorizationResult } from '@/lib/validators/transaction-categorization';
import { useTransactionCategorization } from '@/hooks/use-transaction-categorization';

interface TransactionCategorizerProps {
  organizationId: string;
  userId: string;
  transaction: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    merchantName: string;
    timestamp: string;
    bankAccountId: string;
    currentCategory?: string;
  };
  onCategorized?: (result: AICategorizationResult) => void;
}

export function TransactionCategorizer({
  organizationId,
  userId,
  transaction,
  onCategorized,
}: TransactionCategorizerProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    isCategorizing,
    error,
    categorizeTransaction,
    recategorize,
    lastResult,
    clearResult,
  } = useTransactionCategorization({ organizationId, userId });

  const handleCategorize = async () => {
    try {
      const result = await categorizeTransaction({
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
          merchantName: transaction.merchantName,
          timestamp: transaction.timestamp,
          bankAccountId: transaction.bankAccountId,
        },
        includeAlternatives: true,
        useHistoricalContext: true,
      });
      
      if (onCategorized && !result.needsReview) {
        onCategorized(result);
      }
    } catch (err) {
      console.error('Error categorizando:', err);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getTaxTreatmentBadge = (treatment: string) => {
    switch (treatment) {
      case 'deductible':
        return <Badge className="bg-green-100 text-green-800">Deducible</Badge>;
      case 'non_deductible':
        return <Badge className="bg-red-100 text-red-800">No Deducible</Badge>;
      case 'partial_deductible':
        return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Categorización Inteligente
        </CardTitle>
        <CardDescription>
          IA para clasificación automática de transacciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de la transacción */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Proveedor</p>
            <p className="font-medium">{transaction.merchantName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monto</p>
            <p className="font-medium">
              {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} {transaction.currency}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Descripción</p>
            <p className="text-sm">{transaction.description}</p>
          </div>
        </div>

        {/* Botón de categorizar */}
        {!lastResult && (
          <Button
            onClick={handleCategorize}
            disabled={isCategorizing}
            className="w-full"
          >
            {isCategorizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Categorizar Automáticamente
              </>
            )}
          </Button>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado */}
        {lastResult && (
          <div className="space-y-4">
            {/* Header del resultado */}
            <div className={`p-4 rounded-lg border ${getConfidenceColor(lastResult.confidence)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {lastResult.needsReview ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{lastResult.categoryName}</span>
                </div>
                <Badge variant="outline">
                  {(lastResult.confidence * 100).toFixed(0)}% confianza
                </Badge>
              </div>
              <p className="text-sm opacity-90">Subcategoría: {lastResult.subcategory}</p>
            </div>

            {/* Detalles fiscales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Tratamiento Fiscal</p>
                {getTaxTreatmentBadge(lastResult.taxTreatment)}
              </div>
              {lastResult.vatAmount !== undefined && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">IVA Estimado</p>
                  <p className="font-semibold">
                    {lastResult.vatAmount.toFixed(2)} {transaction.currency}
                    {lastResult.vatRate && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({(lastResult.vatRate * 100).toFixed(0)}%)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Información del proveedor */}
            {lastResult.merchantInfo && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <p className="font-medium text-sm">Información del Proveedor</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo:</span>{' '}
                    <span className="font-medium">{lastResult.merchantInfo.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Categoría:</span>{' '}
                    <span className="font-medium">{lastResult.merchantInfo.category}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Razonamiento */}
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <p className="font-medium text-sm">Razonamiento de la IA</p>
              </div>
              <p className="text-sm text-gray-700">{lastResult.reasoning}</p>
            </div>

            {/* Categorías alternativas */}
            {lastResult.alternativeCategories && lastResult.alternativeCategories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Categorías Alternativas:</p>
                <div className="space-y-2">
                  {lastResult.alternativeCategories.map((alt, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{alt.categoryId}</span>
                      <Badge variant="secondary">
                        {(alt.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="flex-1"
              >
                {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
              </Button>
              <Button
                variant={lastResult.needsReview ? 'default' : 'secondary'}
                onClick={clearResult}
                className="flex-1"
              >
                {lastResult.needsReview ? 'Revisar Manualmente' : 'Aceptar'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
