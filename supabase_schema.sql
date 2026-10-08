-- =========================================================
-- ESQUEMA DE BASE DE DATOS SUPABASE PARA AUDITORÍAS MI GUSTO
-- =========================================================
-- Copiá y pegá este script en el SQL Editor de tu panel de Supabase y dale a "RUN":
-- https://supabase.com/dashboard/project/okwtsuezbuleozvahvpm/sql/new

-- 1. Crear tabla de auditorías
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda TEXT NOT NULL,
    auditor TEXT,
    fecha TEXT,
    colaboradores TEXT,
    "personalACargo" TEXT,
    unidades TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT,
    completa BOOLEAN DEFAULT false,
    evaluados INTEGER DEFAULT 0,
    segmentos JSONB DEFAULT '[]'::jsonb,
    desvios JSONB DEFAULT '[]'::jsonb,
    fotos JSONB DEFAULT '[]'::jsonb,
    respuestas JSONB DEFAULT '{}'::jsonb,
    resumen TEXT,
    "savedBy" TEXT,
    "savedAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. Conceder permisos a los roles anónimos y autenticados
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audits TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para lectura, inserción, actualización y borrado
DROP POLICY IF EXISTS "Permitir lectura publica de auditorias" ON public.audits;
CREATE POLICY "Permitir lectura publica de auditorias" 
ON public.audits FOR SELECT 
TO anon, authenticated, service_role
USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de auditorias" ON public.audits;
CREATE POLICY "Permitir insercion publica de auditorias" 
ON public.audits FOR INSERT 
TO anon, authenticated, service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de auditorias" ON public.audits;
CREATE POLICY "Permitir actualizacion publica de auditorias" 
ON public.audits FOR UPDATE 
TO anon, authenticated, service_role
USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica de auditorias" ON public.audits;
CREATE POLICY "Permitir eliminacion publica de auditorias" 
ON public.audits FOR DELETE 
TO anon, authenticated, service_role
USING (true);

-- 5. Habilitar Realtime para la tabla audits (si no está agregada)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'audits'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audits;
    END IF;
END $$;

-- 6. Crear Bucket de Storage para fotos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit-photos', 'audit-photos', true)
ON CONFLICT (id) DO NOTHING;

GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Permitir lectura publica de fotos" ON storage.objects;
CREATE POLICY "Permitir lectura publica de fotos" 
ON storage.objects FOR SELECT 
TO anon, authenticated, service_role
USING (bucket_id = 'audit-photos');

DROP POLICY IF EXISTS "Permitir subida publica de fotos" ON storage.objects;
CREATE POLICY "Permitir subida publica de fotos" 
ON storage.objects FOR INSERT 
TO anon, authenticated, service_role
WITH CHECK (bucket_id = 'audit-photos');

DROP POLICY IF EXISTS "Permitir modificacion publica de fotos" ON storage.objects;
CREATE POLICY "Permitir modificacion publica de fotos" 
ON storage.objects FOR UPDATE 
TO anon, authenticated, service_role
USING (bucket_id = 'audit-photos');

DROP POLICY IF EXISTS "Permitir borrado publico de fotos" ON storage.objects;
CREATE POLICY "Permitir borrado publico de fotos" 
ON storage.objects FOR DELETE 
TO anon, authenticated, service_role
USING (bucket_id = 'audit-photos');
