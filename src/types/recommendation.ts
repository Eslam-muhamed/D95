export interface RecommendationAnswer {
    temperature: 'hot' | 'cold' | 'any';
    mood: 'energize' | 'relax' | 'indulge' | 'refresh';
    flavor: 'sweet' | 'bitter' | 'fruity' | 'creamy';
    sweetness: 'none' | 'light' | 'medium' | 'sweet';
}
