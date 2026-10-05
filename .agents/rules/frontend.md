# Frontend Development Rules

## State Management
- Use `Zustand` for global state (e.g., `themeStore`, `cartStore`, `bookingStore`, `tournamentStore`).
- Avoid passing props down many levels (prop drilling). Use the existing Zustand stores.

## Routing
- We use React Router v6.
- The entry point for routing is `App.tsx` and the pages are in `src/pages/`.

## Styling
- Use **Tailwind CSS**.
- Follow the established design tokens in `index.css` and `tailwind.config.ts`.
- The UI supports a cinematic **Dark Mode** and a premium **Light Mode** (concrete-inspired). When adding new UI elements, always ensure they look good in both modes using Tailwind's `dark:` classes.

## Components
- Keep components modular.
- **CRITICAL:** Always refer to `FRONTEND_MAP.md` to locate existing components before creating new ones (e.g., use `BottomNav.tsx` for mobile navigation, `CartSheet.tsx` for the cart).
- Avoid duplication of UI elements.

## Error Handling
- Use the established Error Boundary (`ErrorBoundary.tsx`) or Toast notifications (`Sonner`) for user-facing errors rather than silent console logs.
