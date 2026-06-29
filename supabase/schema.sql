-- =====================================================
-- CRM: Gestão de Coleta — Instituto Robótica Sustentável
-- Schema SQL para Supabase (PostgreSQL)
-- =====================================================

-- Limpeza caso já existam (Idempotente)
DROP TABLE IF EXISTS solicitacoes CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS pontos_coleta CASCADE;
DROP TABLE IF EXISTS veiculos_rotas CASCADE;
DROP TYPE IF EXISTS tipo_cliente CASCADE;
DROP TYPE IF EXISTS status_solicitacao CASCADE;
DROP TYPE IF EXISTS turno_agendamento CASCADE;

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
-- 7. SEED: Pontos de Coleta Iniciais (Fortaleza - CE)
-- ─────────────────────────────────────────────
INSERT INTO pontos_coleta (nome, endereco, cidade, estado, cep, horario_funcionamento) VALUES
  (
    'Ninna Hub',
    'Av. Dom Manuel, 1020 — Centro',
    'Fortaleza',
    'CE',
    '60060-090',
    'Seg–Sex: 08h–18h'
  ),
  (
    'Sede Robótica Sustentável',
    'Rua Francisquinha Portela, 1050 c Altos',
    'Fortaleza',
    'CE',
    '60351-840',
    'Seg–Sex: 08h–17h'
  ),
  (
    'ALECE',
    'Av. Des. Moreira, 2807 — Dionísio Torres',
    'Fortaleza',
    'CE',
    '60170-173',
    'Seg–Sex: 08h–17h'
  ),
  (
    'Super Mercadinhos São Luiz',
    'Av. Oliveira Paiva, 170 — Cidade dos Funcionários',
    'Fortaleza',
    'CE',
    '60822-310',
    'Seg–Sex: 07h–22h | Dom: 07h–20h'
  ),
  (
    'Transforme Coworking',
    'Rua Torres Câmara, 600 — Casa 47 — Aldeota',
    'Fortaleza',
    'CE',
    '60150-060',
    'Seg–Sex: 08h–18h'
  ),
  (
    'IEL Ceará',
    'Av. Barão de Studart, 1980 — Mezanino — Aldeota',
    'Fortaleza',
    'CE',
    '60120-001',
    'Seg–Sex: 08h–17h'
  ),
  (
    'SINDIVERDE',
    'Av. Barão de Studart, 1980 — 1º ANDAR — Aldeota',
    'Fortaleza',
    'CE',
    '60120-001',
    'Seg–Sex: 08h–17h'
  ),
  (
    'Unifametro',
    'R. Carneiro da Cunha, 180 — Jacarecanga',
    'Fortaleza',
    'CE',
    '60010-470',
    'Seg–Sex: 08h–22h | Sáb: 08h–12h'
  );

-- ─────────────────────────────────────────────
-- 8. SEED: Veículos Iniciais (Fortaleza)
-- ─────────────────────────────────────────────
INSERT INTO veiculos_rotas (placa, nome, capacidade_kg) VALUES
  ('OSV-2026', 'Caminhão Coleta 01', 1200),
  ('NUX-4321', 'Van Reciclagem 02', 600),
  ('PMG-9876', 'Caminhão Caçamba 03', 2000);

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
