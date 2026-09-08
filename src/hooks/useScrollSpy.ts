import { useEffect, useState } from 'react';

export function useScrollSpy(ids: string[], threshold = 0.3): string {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        if (ids.length === 0) return;

        const observers: IntersectionObserver[] = [];

        ids.forEach(id => {
            const el = document.getElementById(`section-${id}`);
            if (!el) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveId(id);
                    }
                },
                { threshold, rootMargin: '-56px 0px -50% 0px' }
            );

            observer.observe(el);
            observers.push(observer);
        });

        return () => {
            observers.forEach(obs => obs.disconnect());
        };
    }, [ids, threshold]);

    return activeId;
}
