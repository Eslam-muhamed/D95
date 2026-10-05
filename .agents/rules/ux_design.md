# UX and Design Standards

## Cinematic Experience
- The app must maintain a "premium", "bold", and "cinematic" feel as described in the project architecture.
- Use **Framer Motion** for animations and transitions (e.g., page transitions, modal opening, 3D room selection).
- Do not remove or break existing animations when refactoring components. Ensure interactions have a dynamic feel (hover states, micro-animations).

## Sound Effects (Web Audio API)
- The app uses sound effects to enhance the experience (e.g., PS5 startup sound, cart item added).
- Sounds are managed via `src/lib/sound.ts`.
- When adding critical interactions (like successful booking, adding a premium item, or opening special rooms), consider if triggering a sound from `sound.ts` is appropriate to maintain the cinematic vibe.

## Responsive Design
- The application must be 100% responsive.
- We use a Mobile-first approach. 
- Use the `BottomNav` for mobile navigation instead of complex headers.
- Always check that complex layouts (like `BookingTimelineSchedule`) gracefully degrade on small screens.

## Theming
- Ensure all new elements conform to the established color palette (e.g. dark colors for dark mode, concrete/neutral colors for light mode).
- Do not use generic, default Tailwind colors if there are established design tokens.
