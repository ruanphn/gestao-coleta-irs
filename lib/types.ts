export type TipoCliente = 'PF' | 'PJ';

export type StatusSolicitacao =
  | 'pendente'
  | 'em_analise'
  | 'agendado'
  | 'concluido';

export type TurnoAgendamento = 'manha' | 'tarde';

export interface Cliente {
  id: string;
  nome: string;
  tipo: TipoCliente;
  cpf_cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  created_at: string;
}

export interface Solicitacao {
  id: string;
  cliente_id: string;
  cliente?: Cliente;
  status: StatusSolicitacao;
  descricao_material: string;
  imagem_url?: string;
  ponto_coleta_id?: string;
  ponto_coleta?: PontoColeta;
  veiculo_id?: string;
  veiculo?: Veiculo;
  data_agendada?: string;
  turno?: TurnoAgendamento;
  observacoes?: string;
  declaracao_enviada: boolean;
  created_at: string;
  updated_at: string;
}

export interface PontoColeta {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude?: number;
  longitude?: number;
  horario_funcionamento?: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  nome: string;
  capacidade_kg?: number;
  ativo: boolean;
  created_at: string;
}

export interface SolicitacaoComCliente extends Solicitacao {
  cliente: Cliente;
}

// API Payloads
export interface CriarSolicitacaoPayload {
  // Cliente
  nome: string;
  tipo: TipoCliente;
  cpf_cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  // Solicitação
  descricao_material: string;
  imagem_url?: string;
}

export interface AtualizarSolicitacaoPayload {
  status?: StatusSolicitacao;
  ponto_coleta_id?: string;
  veiculo_id?: string;
  data_agendada?: string;
  turno?: TurnoAgendamento;
  observacoes?: string;
  declaracao_enviada?: boolean;
  descricao_material?: string;
}
