// ─── TEXTURES ─────────────────────────────────────────────────────────────────

const TEXTURES = [
  { id: 'default', label: 'Default', swatch: 'radial-gradient(circle at 35% 30%, #faf9f6, #d0cbbe)' },
  { id: 'wood',    label: 'Wood',    swatch: 'radial-gradient(circle at 35% 30%, #d4905a, #5c2e0a)' },
  { id: 'jade',    label: 'Jade',    swatch: 'radial-gradient(circle at 35% 30%, #68bc88, #1a5230)' },
  { id: 'crystal', label: 'Crystal', swatch: 'radial-gradient(circle at 35% 30%, #eef8ff, #70b8e0)' },
  { id: 'marble',  label: 'Marble',  swatch: 'radial-gradient(circle at 35% 30%, #f5f4f0, #c0bab4)' },
];

// ─── CATALOGUE ────────────────────────────────────────────────────────────────

const CATALOGUE = {
  crystal: [
    { id: 'white-crystal', name: 'White Crystal',   price: 2,  gradient: ['#f8f8ff', '#e8e8f0'], shimmer: true },
    { id: 'rose-quartz',   name: 'Rose Quartz',     price: 3,  gradient: ['#f9c5d1', '#f48fb1'] },
    { id: 'amethyst',      name: 'Amethyst',        price: 4,  gradient: ['#9c72b5', '#6a3fa1'] },
    { id: 'citrine',       name: 'Citrine',         price: 3,  gradient: ['#f5c842', '#e8a800'] },
    { id: 'aquamarine',    name: 'Aquamarine',      price: 5,  gradient: ['#7ec8e3', '#0b8dba'] },
    { id: 'obsidian',      name: 'Obsidian',        price: 3,  gradient: ['#2c2c2c', '#111111'] },
    { id: 'moonstone',     name: 'Moonstone',       price: 6,  gradient: ['#d4e8f5', '#a8d0ed'], shimmer: true },
    { id: 'labradorite',   name: 'Labradorite',     price: 7,  gradient: ['#5c7a8a', '#3a566a'] },
    { id: 'turquoise',     name: 'Turquoise',       price: 5,  gradient: ['#40e0d0', '#1aa090'] },
    { id: 'sunstone',      name: 'Sunstone',        price: 6,  gradient: ['#ff9a3c', '#e06b00'] },
  ],
  stone: [
    { id: 'marble',        name: 'White Marble',    price: 4,  gradient: ['#f0ede8', '#d8d4cc'] },
    { id: 'black-onyx',    name: 'Black Onyx',      price: 3,  gradient: ['#1a1a1a', '#050505'] },
    { id: 'tiger-eye',     name: 'Tiger Eye',       price: 4,  gradient: ['#c8860a', '#8b5e0a'] },
    { id: 'jade',          name: 'Jade',            price: 8,  gradient: ['#5da85d', '#2d7a2d'] },
    { id: 'lapis',         name: 'Lapis Lazuli',    price: 6,  gradient: ['#1a3a7a', '#0d2050'] },
    { id: 'red-agate',     name: 'Red Agate',       price: 3,  gradient: ['#c0392b', '#922b21'] },
    { id: 'jasper',        name: 'Jasper',          price: 3,  gradient: ['#8b4513', '#5a2d0c'] },
    { id: 'malachite',     name: 'Malachite',       price: 7,  gradient: ['#2e8b57', '#145a32'] },
  ],
  shell: [
    { id: 'pearl',         name: 'Pearl',           price: 8,  gradient: ['#faf9f6', '#e8e4de'], shimmer: true },
    { id: 'abalone',       name: 'Abalone',         price: 10, gradient: ['#6bbfbf', '#4a9fa0'] },
    { id: 'mother-pearl',  name: 'Mother of Pearl', price: 7,  gradient: ['#f0ece8', '#c8c0b8'], shimmer: true },
    { id: 'paua',          name: 'Paua Shell',      price: 9,  gradient: ['#5040a0', '#302060'] },
  ],
  accent: [
    { id: 'gold-spacer',   name: 'Gold Spacer',     price: 2,  gradient: ['#d4af37', '#b8960c'] },
    { id: 'silver-spacer', name: 'Silver Spacer',   price: 2,  gradient: ['#c0c0c0', '#909090'] },
    { id: 'hematite',      name: 'Hematite',        price: 2,  gradient: ['#4a4a4a', '#2a2a2a'] },
    { id: 'pyrite',        name: 'Pyrite',          price: 3,  gradient: ['#c8b850', '#a09030'] },
    { id: 'clear-quartz',  name: 'Clear Quartz',    price: 2,  gradient: ['#e8f4ff', '#cce0ff'], shimmer: true },
  ],

  // ── Accessories supercategory ──────────────────────────────────────────────
  charms: [
    { id: 'heart-charm',     name: 'Heart',       price: 8,  color: '#e91e8c', shape: 'heart' },
    { id: 'star-charm',      name: 'Star',        price: 6,  color: '#d4af37', shape: 'star' },
    { id: 'moon-charm',      name: 'Crescent',    price: 7,  color: '#b0c8e8', shape: 'moon' },
    { id: 'butterfly-charm', name: 'Butterfly',   price: 9,  color: '#9c27b0', shape: 'butterfly' },
    { id: 'flower-charm',    name: 'Flower',      price: 7,  color: '#ff6b9d', shape: 'flower' },
    { id: 'infinity-charm',  name: 'Infinity',    price: 8,  color: '#d4af37', shape: 'infinity' },
  ],
  spacers: [
    { id: 'gold-disc',           name: 'Gold Disc',        price: 2, color: '#d4af37', shape: 'flat-disc' },
    { id: 'silver-disc',         name: 'Silver Disc',      price: 2, color: '#c0c0c0', shape: 'flat-disc' },
    { id: 'gold-rondelle',       name: 'Gold Rondelle',    price: 3, color: '#d4af37', shape: 'rondelle' },
    { id: 'silver-rondelle',     name: 'Silver Rondelle',  price: 3, color: '#c0c0c0', shape: 'rondelle' },
    { id: 'crystal-rondelle',    name: 'Crystal Rondelle', price: 4, color: '#d4f0ff', shape: 'rondelle' },
  ],
  pendants: [
    { id: 'gold-coin',      name: 'Gold Coin',    price: 10, color: '#d4af37', shape: 'coin' },
    { id: 'evil-eye',       name: 'Evil Eye',     price: 8,  color: '#1565c0', shape: 'evil-eye' },
    { id: 'hexagon-silver', name: 'Hexagon',      price: 7,  color: '#9e9e9e', shape: 'hexagon' },
    { id: 'cross-gold',     name: 'Gold Cross',   price: 7,  color: '#d4af37', shape: 'cross' },
    { id: 'cross-silver',   name: 'Silver Cross', price: 7,  color: '#c0c0c0', shape: 'cross' },
  ],
};

const SUPERCATS = {
  beads: [
    { cat: 'crystal', label: 'Crystal' },
    { cat: 'stone',   label: 'Natural Stone' },
    { cat: 'shell',   label: 'Shell' },
    { cat: 'accent',  label: 'Accent' },
  ],
  accessories: [
    { cat: 'charms',   label: 'Charms' },
    { cat: 'spacers',  label: 'Spacers' },
    { cat: 'pendants', label: 'Pendants' },
  ],
};

// ─── SIZE WHEEL CONSTANTS ─────────────────────────────────────────────────────

// Sectors 0-3 map clockwise to: right(10), bottom(12), left(14), top(6)
const WHEEL_SIZES = [10, 12, 14, 6];
const WHEEL_INNER = 26;   // inner hole radius (px on overlay canvas)
const WHEEL_OUTER = 70;   // outer radius
