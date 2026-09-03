-- ============================================================
-- M. Oliveira - Migração SQLite -> Supabase Postgres
-- RODE ESTE SCRIPT NO SQL EDITOR DO SUPABASE (Dashboard > SQL Editor)
-- ============================================================

-- Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fotos
CREATE TABLE IF NOT EXISTS public.photos (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT,
  title TEXT,
  service_id BIGINT DEFAULT 0,
  sort_order BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Logos
CREATE TABLE IF NOT EXISTS public.logos (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT,
  company_name TEXT,
  sort_order BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conteúdo (chave única por seção)
CREATE TABLE IF NOT EXISTS public.content (
  id BIGSERIAL PRIMARY KEY,
  section TEXT UNIQUE,
  value TEXT
);

-- Blog
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solicitações (formulário de contato)
CREATE TABLE IF NOT EXISTS public.submissions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT DEFAULT '',
  service TEXT DEFAULT '',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Serviços
CREATE TABLE IF NOT EXISTS public.services (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  icon TEXT DEFAULT '📋',
  sort_order BIGINT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Diferenciais
CREATE TABLE IF NOT EXISTS public.diferenciais (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  icon TEXT DEFAULT '⭐',
  sort_order BIGINT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (a chave service_secret continua tendo acesso total)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diferenciais ENABLE ROW LEVEL SECURITY;
