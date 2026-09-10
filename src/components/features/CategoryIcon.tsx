import React from 'react';
import {
  Coffee,
  CupSoda,
  CakeSlice,
  Gamepad2,
  Flame,
  Zap,
  Users,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

export interface CategoryIconProps {
  categoryId?: string;
  icon?: string;
  className?: string;
  size?: number;
}

export default function CategoryIcon({
  categoryId,
  icon,
  className = 'w-4 h-4',
  size = 15,
}: CategoryIconProps) {
  const id = (categoryId || '').toLowerCase().trim();
  const raw = (icon || '').toLowerCase().trim();

  // 1. Hot Drinks
  if (
    id === 'hot-drinks' ||
    id.includes('hot') ||
    id.includes('coffee') ||
    id.includes('tea') ||
    raw === '☕' ||
    raw === 'hot-drinks' ||
    raw === 'coffee'
  ) {
    return <Coffee size={size} className={className} strokeWidth={2.2} />;
  }

  // 2. Cold Drinks (Iced coffee, juices, smoothies, mojitos, milkshakes)
  if (
    id === 'cold-drinks' ||
    id.includes('cold') ||
    id.includes('juice') ||
    id.includes('smoothie') ||
    id.includes('mocktail') ||
    id.includes('milkshake') ||
    raw === '🧊' ||
    raw === '🥤' ||
    raw === '🍹' ||
    raw === '🍊' ||
    raw === '🥛' ||
    raw === 'cold-drinks' ||
    raw === 'drinks'
  ) {
    return <CupSoda size={size} className={className} strokeWidth={2.2} />;
  }

  // 3. Desserts (Cakes, waffles, crepes, sweets)
  if (
    id === 'desserts' ||
    id.includes('dessert') ||
    id.includes('waffle') ||
    id.includes('crepe') ||
    id.includes('cake') ||
    raw === '🍰' ||
    raw === '🧇' ||
    raw === '🫔' ||
    raw === 'desserts' ||
    raw === 'sweet'
  ) {
    return <CakeSlice size={size} className={className} strokeWidth={2.2} />;
  }

  // 4. All Categories / Gaming
  if (id === 'all' || raw === '🎮' || raw === 'game' || id.includes('game')) {
    return <Gamepad2 size={size} className={className} strokeWidth={2.2} />;
  }

  // 5. Offers / Hot Deals
  if (id === 'offers' || raw === '🔥' || raw === 'flame') {
    return <Flame size={size} className={className} strokeWidth={2.2} />;
  }

  // 6. Happy Hour / Lightning
  if (raw === '⚡' || raw === 'zap' || id.includes('hour')) {
    return <Zap size={size} className={className} strokeWidth={2.2} />;
  }

  // 7. Group / Squads
  if (raw === '👥' || raw === 'users' || id.includes('group')) {
    return <Users size={size} className={className} strokeWidth={2.2} />;
  }

  // 8. Sparkles / Special
  if (raw === '✨' || raw === 'star') {
    return <Sparkles size={size} className={className} strokeWidth={2.2} />;
  }

  // Default fallback
  return <UtensilsCrossed size={size} className={className} strokeWidth={2.2} />;
}
