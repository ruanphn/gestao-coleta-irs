-- =====================================================
-- CRM: Gestão de Coleta — Instituto Robótica Sustentável
-- Schema SQL para Supabase (PostgreSQL)
-- =====================================================

-- Habilita extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. TIPOS ENUMERADOS
-- ─────────────────────────────────────────────
CREATE TYPE tipo_cliente AS ENUM ('PF', 'PJ');
CREATE TYPE status_solicitacao AS ENUM ('pendente', 'em_analise', 'agendado', 'concluido');
CREATE TYPE turno_agendamento AS ENUM ('manha', 'tarde');

-- ─────────────────────────────────────────────
-- 2. TABELA: clientes
-- ─────────────────────────────────────────────
CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  tipo        tipo_cliente NOT NULL,
  cpf_cnpj    TEXT NOT NULL,
  endereco    TEXT NOT NULL,
  cidade      TEXT NOT NULL,
  estado      TEXT NOT NULL,
  cep         TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. TABELA: pontos_coleta
-- ─────────────────────────────────────────────
CREATE TABLE pontos_coleta (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                  TEXT NOT NULL,
  endereco              TEXT NOT NULL,
  cidade                TEXT NOT NULL,
  estado                TEXT NOT NULL,
  cep                   TEXT NOT NULL,
  latitude              DECIMAL(10,8),
  longitude             DECIMAL(11,8),
  horario_funcionamento TEXT,
  telefone              TEXT,
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. TABELA: veiculos_rotas
-- ─────────────────────────────────────────────
CREATE TABLE veiculos_rotas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa         TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  capacidade_kg INTEGER,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. TABELA: solicitacoes
-- ─────────────────────────────────────────────
CREATE TABLE solicitacoes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  status              status_solicitacao NOT NULL DEFAULT 'pendente',
  descricao_material  TEXT NOT NULL,
  imagem_url          TEXT,
  ponto_coleta_id     UUID REFERENCES pontos_coleta(id) ON DELETE SET NULL,
  veiculo_id          UUID REFERENCES veiculos_rotas(id) ON DELETE SET NULL,
  data_agendada       DATE,
  turno               turno_agendamento,
  observacoes         TEXT,
  declaracao_enviada  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER solicitacoes_updated_at
  BEFORE UPDATE ON solicitacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- 6. ÍNDICES PARA PERFORMANCE
-- ─────────────────────────────────────────────
CREATE INDEX idx_solicitacoes_status     ON solicitacoes(status);
CREATE INDEX idx_solicitacoes_cliente_id ON solicitacoes(cliente_id);
CREATE INDEX idx_solicitacoes_created_at ON solicitacoes(created_at DESC);

-- ─────────────────────────────────────────────
-- 7. SEED: Pontos de Coleta Iniciais
-- ─────────────────────────────────────────────
INSERT INTO pontos_coleta (nome, endereco, cidade, estado, cep, horario_funcionamento) VALUES
  (
    'Ponto Coleta Centro',
    'Rua das Flores, 100 — Centro',
    'São Paulo',
    'SP',
    '01000-000',
    'Seg–Sex: 08h–18h | Sáb: 08h–13h'
  ),
  (
    'Ponto Coleta Zona Sul',
    'Av. Santo Amaro, 450 — Ibirapuera',
    'São Paulo',
    'SP',
    '04001-000',
    'Seg–Sex: 09h–17h'
  ),
  (
    'Ponto Coleta Zona Norte',
    'Rua Voluntários da Pátria, 220 — Santana',
    'São Paulo',
    'SP',
    '02010-000',
    'Seg–Sex: 08h–17h | Sáb: 09h–12h'
  );

-- ─────────────────────────────────────────────
-- 8. SEED: Veículos Iniciais
-- ─────────────────────────────────────────────
INSERT INTO veiculos_rotas (placa, nome, capacidade_kg) VALUES
  ('ABC-1234', 'Caminhão Verde 01', 1000),
  ('DEF-5678', 'Van Sustentável 02', 500),
  ('GHI-9012', 'Caminhão Verde 03', 1500);

-- ─────────────────────────────────────────────
-- 9. RLS (Row Level Security) - Supabase
--    Para MVP com anon key pública no formulário,
--    permitimos INSERT público em clientes/solicitacoes.
--    O admin usa a service_role_key que bypassa RLS.
-- ─────────────────────────────────────────────
ALTER TABLE clientes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_coleta  ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos_rotas ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública de pontos de coleta ativos (para o formulário público)
CREATE POLICY "pontos_coleta_public_read"
  ON pontos_coleta FOR SELECT
  USING (ativo = TRUE);

-- Permite leitura pública de veículos ativos
CREATE POLICY "veiculos_public_read"
  ON veiculos_rotas FOR SELECT
  USING (ativo = TRUE);

-- Permite INSERT público (formulário do cliente)
CREATE POLICY "clientes_public_insert"
  ON clientes FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "solicitacoes_public_insert"
  ON solicitacoes FOR INSERT
  WITH CHECK (TRUE);

-- Nota: GET e UPDATE das solicitacoes são feitos pela service_role_key no backend,
-- que bypassa RLS automaticamente. Não precisa de policy para o admin.
