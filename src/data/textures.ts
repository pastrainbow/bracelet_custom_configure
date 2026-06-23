import type { TextureDef } from '@/types';

export type TextureId = 'default' | 'wood' | 'jade' | 'crystal' | 'marble';

export const TEXTURES: TextureDef[] = [
  { id: 'default', label: 'Default', swatch: 'radial-gradient(circle at 35% 30%, #faf9f6, #d0cbbe)' },
  { id: 'wood', label: 'Wood', swatch: 'radial-gradient(circle at 35% 30%, #d4905a, #5c2e0a)' },
  { id: 'jade', label: 'Jade', swatch: 'radial-gradient(circle at 35% 30%, #68bc88, #1a5230)' },
  { id: 'crystal', label: 'Crystal', swatch: 'radial-gradient(circle at 35% 30%, #eef8ff, #70b8e0)' },
  { id: 'marble', label: 'Marble', swatch: 'radial-gradient(circle at 35% 30%, #f5f4f0, #c0bab4)' },
];
