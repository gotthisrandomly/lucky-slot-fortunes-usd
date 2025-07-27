-- Fix RLS on graphql_schema_metadata table
ALTER TABLE public.graphql_schema_metadata ENABLE ROW LEVEL SECURITY;

-- Create policy for graphql_schema_metadata (admin only)
CREATE POLICY "Only admins can manage GraphQL schema metadata" 
ON public.graphql_schema_metadata 
FOR ALL 
USING (is_admin());

-- Fix the is_admin function to have proper security definer
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;