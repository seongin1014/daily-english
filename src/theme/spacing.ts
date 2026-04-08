export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8, // 0.5rem
  lg: 12, // 0.75rem — minimum per DESIGN.md
  xl: 24, // 1.5rem — main cards, CTA buttons
  full: 9999,
} as const;

// Ambient shadow — per DESIGN.md: 6% opacity of on-surface (#1a1c1c), blur 24-32
export const ambientShadow = {
  shadowColor: '#1a1c1c',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 4,
} as const;

// Elevated shadow for floating elements (FAB, modals)
export const elevatedShadow = {
  shadowColor: '#1a1c1c',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 32,
  elevation: 8,
} as const;
