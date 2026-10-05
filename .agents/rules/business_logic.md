# Business Logic & Gotchas

## Booking System (PlayStation)
- **Room Formatting**: Follow the established formatting rules for room numbers/names (e.g., VIP vs Standard). Check `src/constants` or the booking store for existing logic before implementing custom formatting.
- **Timeline (`BookingTimelineSchedule.tsx`)**: The timeline schedule is a core and highly complex component. **Do not** alter the time calculation logic, overlapping validation, or grid layout without thorough reasoning and testing.

## Menu & Store Prices
- **Prices & Updates**: Store prices, categories, and menu configurations must be dynamic (fetched from Supabase / managed via Admin Dashboard). Do not hardcode prices or menu items in the frontend components.
- **Bulk Discounts**: When implementing or fixing discount logic (e.g., `BulkDiscountModal`), ensure the logic gracefully handles edge cases (like partial success, error states, and UI feedback like loading bars/spinners). 
- **Cart Customization**: Users can fully customize orders (sugar, ice, add-ons). Ensure that any new menu features integrate correctly with `ItemCustomizerModal.tsx`.

## Admin Operations
- **Feedback**: Admin operations (discounts, updating items) must provide clear feedback (toasts, loading states, error boundaries). Silent failures are unacceptable.
