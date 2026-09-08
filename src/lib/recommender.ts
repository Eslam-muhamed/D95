import type { RecommendationAnswer } from '@/types/recommendation';
import type { MenuItem } from '@/types/menu';
import { allItems } from '@/constants/menuData';

function scoreItem(item: MenuItem, answers: RecommendationAnswer): number {
    let score = 0;

    // Temperature
    if (answers.temperature === 'hot' && item.isHot) score += 3;
    if (answers.temperature === 'cold' && item.isCold) score += 3;
    if (answers.temperature === 'any') score += 1;

    // Mood → category mapping
    const moodCategoryMap: Record<string, string[]> = {
        energize: ['hot-drinks', 'cold-drinks', 'fresh-juice'],
        relax: ['hot-drinks', 'shisha', 'desserts'],
        indulge: ['desserts', 'waffles', 'crepes', 'milkshakes'],
        refresh: ['mocktails', 'fresh-juice', 'smoothies', 'cold-drinks'],
    };
    if (moodCategoryMap[answers.mood]?.includes(item.category)) score += 2;

    // Flavor
    const flavorMap: Record<string, string[]> = {
        sweet: ['desserts', 'waffles', 'crepes', 'milkshakes'],
        bitter: ['hot-drinks', 'cold-drinks'],
        fruity: ['fresh-juice', 'smoothies', 'mocktails'],
        creamy: ['milkshakes', 'smoothies', 'hot-drinks'],
    };
    if (flavorMap[answers.flavor]?.includes(item.category)) score += 2;

    // Sweetness
    if (answers.sweetness === 'none' && item.tags?.includes('sugar-free')) score += 2;
    if (answers.sweetness === 'sweet' && ['desserts', 'milkshakes', 'waffles'].includes(item.category)) score += 2;

    // Boost popular items
    if (item.badge === 'Popular') score += 1;

    return score;
}

export function getRecommendation(answers: RecommendationAnswer): MenuItem {
    const scored = allItems.map(item => ({
        item,
        score: scoreItem(item, answers),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Pick from top 5 randomly for variety
    const top5 = scored.slice(0, 5);
    const random = top5[Math.floor(Math.random() * top5.length)];
    return random.item;
}
