import { z } from 'zod';

export const toggleFavoriteSchema = z.object({
  propertyId: z.string().uuid('Invalid property id'),
});

export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
