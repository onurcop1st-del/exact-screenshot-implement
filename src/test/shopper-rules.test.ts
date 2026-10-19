import { describe, expect, it } from 'vitest';
import { AVATAR_COLORS, DEFAULT_APPEARANCE, colorSchema, commentSchema, initial } from '@/lib/shopper-rules';
describe('Shopper requirements', () => {
  it('offers exactly 100 avatar colours, indexed 0 through 99', () => {
    expect(AVATAR_COLORS).toHaveLength(100); expect(new Set(AVATAR_COLORS).size).toBe(100);
    expect(colorSchema.safeParse(99).success).toBe(true); expect(colorSchema.safeParse(100).success).toBe(false);
  });
  it('defaults to Mix mode', () => { expect(DEFAULT_APPEARANCE).toBe('mix'); });
  it('uses the first username letter for the avatar', () => { expect(initial('onur')).toBe('O'); });
  it('rejects empty comments and accepts a reply', () => { expect(commentSchema.safeParse('  ').success).toBe(false); expect(commentSchema.parse(' Nice drop ')).toBe('Nice drop'); });
});