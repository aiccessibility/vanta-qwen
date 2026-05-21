'use client';

import { useState, useCallback } from 'react';
import { categorizeTransactionWithAI, recategorizeWithFeedback } from '@/features/ai/transaction-categorization.service';
import type { AICategorizationResult, CategorizationRequest } from '@/lib/validators/transaction-categorization';

interface UseTransactionCategorizationProps {
  organizationId: string;
  userId: string;
}

interface UseTransactionCategorizationReturn {
  isCategorizing: boolean;
  error: string | null;
  categorizeTransaction: (request: Omit<CategorizationRequest, 'organizationId' | 'userId'>) => Promise<AICategorizationResult>;
  recategorize: (params: {
    transactionId: string;
    originalCategory: string;
    newCategory: string;
    reason?: string;
  }) => Promise<void>;
  lastResult: AICategorizationResult | null;
  clearResult: () => void;
}

export function useTransactionCategorization({
  organizationId,
  userId,
}: UseTransactionCategorizationProps): UseTransactionCategorizationReturn {
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AICategorizationResult | null>(null);

  const categorizeTransaction = useCallback(
    async (request: Omit<CategorizationRequest, 'organizationId' | 'userId'>) => {
      setIsCategorizing(true);
      setError(null);

      try {
        const result = await categorizeTransactionWithAI({
          ...request,
          organizationId,
          userId,
        });
        setLastResult(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al categorizar transacción';
        setError(errorMessage);
        throw err;
      } finally {
        setIsCategorizing(false);
      }
    },
    [organizationId, userId]
  );

  const recategorize = useCallback(
    async (params: {
      transactionId: string;
      originalCategory: string;
      newCategory: string;
      reason?: string;
    }) => {
      setIsCategorizing(true);
      setError(null);

      try {
        await recategorizeWithFeedback({
          ...params,
          organizationId,
          userId,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al guardar feedback';
        setError(errorMessage);
        throw err;
      } finally {
        setIsCategorizing(false);
      }
    },
    [organizationId, userId]
  );

  const clearResult = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    isCategorizing,
    error,
    categorizeTransaction,
    recategorize,
    lastResult,
    clearResult,
  };
}
