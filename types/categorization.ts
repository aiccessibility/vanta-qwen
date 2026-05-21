import { z } from 'zod';

/**
 * Tipos para la API de categorización de transacciones
 */

// Request/Response para API
export const CategorizeTransactionRequestSchema = z.object({
  transactionId: z.string().uuid(),
  includeAlternatives: z.boolean().default(false),
  useHistoricalContext: z.boolean().default(true),
});

export type CategorizeTransactionRequest = z.infer<typeof CategorizeTransactionRequestSchema>;

export const CategorizeTransactionResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transactionId: z.string().uuid(),
    category: z.string(),
    subcategory: z.string(),
    confidence: z.number().min(0).max(1),
    taxTreatment: z.enum(['deductible', 'non_deductible', 'partial_deductible']),
    vatAmount: z.number().optional(),
    vatRate: z.number().optional(),
    reasoning: z.string(),
    needsReview: z.boolean(),
    merchantInfo: z.object({
      name: z.string(),
      type: z.string(),
      category: z.string(),
    }).optional(),
    alternativeCategories: z.array(
      z.object({
        categoryId: z.string(),
        confidence: z.number(),
      })
    ).optional(),
  }).optional(),
  error: z.string().optional(),
});

export type CategorizeTransactionResponse = z.infer<typeof CategorizeTransactionResponseSchema>;

// Request/Response para feedback
export const SubmitFeedbackRequestSchema = z.object({
  transactionId: z.string().uuid(),
  newCategory: z.string(),
  reason: z.string().optional(),
});

export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackRequestSchema>;

export const SubmitFeedbackResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SubmitFeedbackResponse = z.infer<typeof SubmitFeedbackResponseSchema>;

// Estadísticas de categorización
export const CategorizationStatsSchema = z.object({
  totalTransactions: z.number(),
  autoCategorized: z.number(),
  manualReviewed: z.number(),
  averageConfidence: z.number(),
  needsReviewCount: z.number(),
  byCategory: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
});

export type CategorizationStats = z.infer<typeof CategorizationStatsSchema>;
