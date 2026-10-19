import { z } from 'zod';

export const AVATAR_COLORS = Array.from({ length: 100 }, (_, i) => i);
export const DEFAULT_APPEARANCE = 'mix' as const;
export const usernameSchema = z.string().trim().regex(/^[A-Za-z0-9_.]{2,24}$/, 'Use 2–24 letters, numbers, dots or underscores');
export const colorSchema = z.number().int().min(0).max(99);
export const commentSchema = z.string().trim().min(1, 'Write a comment first').max(500, 'Keep comments under 500 characters');
export function initial(username: string) { return username.trim().charAt(0).toUpperCase() || '?'; }