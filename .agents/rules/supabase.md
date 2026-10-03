# Supabase Database Modifications

When asked to modify the Supabase database schema (creating/altering tables, adding columns, updating policies, etc.), you MUST follow this strict workflow:

1. **NEVER** use direct SQL execution tools (like `execute_sql` from the Supabase MCP or executing queries directly via terminal) to apply schema changes immediately to the database.
2. **ALWAYS** generate a new migration file in the `supabase/migrations/` directory.
3. Use the current timestamp for the file name: `YYYYMMDDHHMMSS_brief_description.sql`.
4. Write the required SQL statements inside this migration file.
5. If the user wants the changes applied, run `supabase db push` or `supabase migration up` via the terminal.

This rule exists to ensure that all database schema changes are version-controlled alongside the codebase, allowing for easy `Undo` operations by simply discarding the created file or running `supabase db reset`.
