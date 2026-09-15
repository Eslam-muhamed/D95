
DROP POLICY IF EXISTS "Allow staff update app_settings" ON "public"."app_settings";
CREATE POLICY "Allow admin update app_settings" ON "public"."app_settings" TO "authenticated" 
USING ((EXISTS ( SELECT 1 FROM "public"."staff_users" WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1 FROM "public"."staff_users" WHERE (("staff_users"."email" = ("auth"."jwt"() ->> 'email'::"text")) AND ("staff_users"."role" = 'admin'::"text")))));

DROP POLICY IF EXISTS "Allow authenticated read staff_users" ON "public"."staff_users";
CREATE POLICY "Allow authenticated read staff_users" ON "public"."staff_users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1 FROM "public"."staff_users" su WHERE (su."email" = ("auth"."jwt"() ->> 'email'::"text")))));




