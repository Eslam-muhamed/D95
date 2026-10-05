# D95 Project AI Instructions (Gemini Rules)

This repository contains important rules and context for AI coding assistants (like Gemini/Antigravity) to ensure consistency across sessions and avoid breaking existing functionality.

## Configuration & Rules
All specific rules are located in the `.agents/rules/` directory:

- [Frontend Rules](.agents/rules/frontend.md)
- [UX & Design Rules](.agents/rules/ux_design.md)
- [Supabase & Database](.agents/rules/supabase.md)
- [Business Logic & Gotchas](.agents/rules/business_logic.md)

**Mandatory Guidelines:**
1. **Read `FRONTEND_MAP.md`**: Before making changes to the UI, refer to `FRONTEND_MAP.md` to know exactly which component handles what.
2. **Read `PROJECT_DESCRIPTION.md`**: For a high-level overview of the project architecture.
3. **Always Check Rules**: Before starting any feature, review the rules in `.agents/rules/` to avoid violating established patterns (e.g., how we format room numbers, how we apply bulk discounts, how we manage the cart).
