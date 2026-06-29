'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formatCPF = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatCNPJ = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

const formatTelefone = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

const formatCEP = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
};

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  tipo: z.enum(['PF', 'PJ'] as const),
  cpf_cnpj: z.string().refine((val) => {
    const clean = val.replace(/\D/g, '');
    return clean.length === 11 || clean.length === 14;
  }, 'CPF (11 dígitos) ou CNPJ (14 dígitos) inválido'),
  endereco: z.string().min(5, 'Informe o endereço completo'),
  cidade: z.string().min(2, 'Informe a cidade'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: CE)'),
  cep: z.string().refine((val) => val.replace(/\D/g, '').length === 8, 'CEP deve ter 8 dígitos'),
  telefone: z.string().refine((val) => {
    const len = val.replace(/\D/g, '').length;
    return len === 10 || len === 11;
  }, 'Telefone deve ter 10 ou 11 dígitos'),
  email: z.string().email('E-mail inválido'),
  descricao_material: z.string().min(10, 'Descreva os materiais com ao menos 10 caracteres'),
});

type FormData = z.infer<typeof schema>;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function SolicitacaoForm() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'PF' },
  });

  const tipo = watch('tipo');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitState('loading');
    setErrorMessage('');

    // Clean formatting characters before sending to API
    const cleanData = {
      ...data,
      cpf_cnpj: data.cpf_cnpj.replace(/\D/g, ''),
      telefone: data.telefone.replace(/\D/g, ''),
      cep: data.cep.replace(/\D/g, ''),
    };

    try {
      let imagem_url: string | undefined;

      // Upload de imagem (se fornecida)
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imagem_url = uploadData.url;
        }
      }

      // Criar solicitação
      const res = await fetch('/api/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cleanData, imagem_url }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao enviar solicitação.');
      }

      setSubmitState('success');
      reset();
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      setSubmitState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erro inesperado.');
    }
  };

  if (submitState === 'success') {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Solicitação enviada!</h2>
        <p className="text-gray-500 mb-2 max-w-md mx-auto">
          Sua solicitação está <span className="font-semibold text-green-700">Em Análise</span>.
          Nossa equipe irá avaliar e entrar em contato pelo e-mail ou telefone informados.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          ♻️ Obrigado por contribuir com um descarte responsável!
        </p>
        <button
          onClick={() => setSubmitState('idle')}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
        >
          Fazer nova solicitação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo PF/PJ */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Solicitante</label>
        <div className="grid grid-cols-2 gap-3">
          {(['PF', 'PJ'] as const).map((t) => (
            <label
              key={t}
              className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                tipo === t
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                value={t}
                {...register('tipo', {
                  onChange: () => {
                    // Reset fields to avoid mixing masks
                    setValue('cpf_cnpj', '');
                  }
                })}
                className="sr-only"
              />
              <span className="font-bold text-lg mr-2">{t === 'PF' ? '👤' : '🏢'}</span>
              <span className="font-semibold">{t === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nome / Razão Social */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {tipo === 'PF' ? 'Nome completo' : 'Razão Social'}
        </label>
        <input
          {...register('nome')}
          type="text"
          placeholder={tipo === 'PF' ? 'João da Silva' : 'Empresa Ltda.'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
        />
        {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome.message}</p>}
      </div>

      {/* CPF/CNPJ */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {tipo === 'PF' ? 'CPF' : 'CNPJ'}
        </label>
        <input
          {...register('cpf_cnpj', {
            onChange: (e) => {
              e.target.value = tipo === 'PF' ? formatCPF(e.target.value) : formatCNPJ(e.target.value);
            }
          })}
          type="text"
          maxLength={tipo === 'PF' ? 14 : 18}
          placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
        />
        {errors.cpf_cnpj && <p className="mt-1 text-xs text-red-500">{errors.cpf_cnpj.message}</p>}
      </div>

      {/* Endereço */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Endereço (Rua, Número, Bairro)</label>
        <input
          {...register('endereco')}
          type="text"
          placeholder="Rua das Flores, 100 — Centro"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
        />
        {errors.endereco && <p className="mt-1 text-xs text-red-500">{errors.endereco.message}</p>}
      </div>

      {/* Cidade, Estado, CEP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cidade</label>
          <input
            {...register('cidade')}
            type="text"
            placeholder="Fortaleza"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
          />
          {errors.cidade && <p className="mt-1 text-xs text-red-500">{errors.cidade.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado</label>
          <input
            {...register('estado')}
            type="text"
            maxLength={2}
            placeholder="CE"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400 uppercase"
          />
          {errors.estado && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">CEP</label>
          <input
            {...register('cep', {
              onChange: (e) => {
                e.target.value = formatCEP(e.target.value);
              }
            })}
            type="text"
            maxLength={9}
            placeholder="60000-000"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
          />
          {errors.cep && <p className="mt-1 text-xs text-red-500">{errors.cep.message}</p>}
        </div>
      </div>

      {/* Telefone e E-mail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefone / WhatsApp</label>
          <input
            {...register('telefone', {
              onChange: (e) => {
                e.target.value = formatTelefone(e.target.value);
              }
            })}
            type="tel"
            maxLength={15}
            placeholder="(85) 99999-9999"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
          />
          {errors.telefone && <p className="mt-1 text-xs text-red-500">{errors.telefone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      {/* Descrição do material */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição dos materiais</label>
        <textarea
          {...register('descricao_material')}
          rows={4}
          placeholder="Ex: 2 computadores antigos, 3 monitores CRT, 1 impressora jato de tinta quebrada..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 placeholder-gray-400 resize-none"
        />
        {errors.descricao_material && (
          <p className="mt-1 text-xs text-red-500">{errors.descricao_material.message}</p>
        )}
      </div>

      {/* Upload de imagem */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Foto dos materiais <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <div className="relative">
          <input
            type="file"
            id="imagem"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
          <label
            htmlFor="imagem"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-xl" />
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-400">Clique para adicionar uma foto</span>
                <span className="text-xs text-gray-300 mt-1">JPG, PNG ou WebP — máx. 5MB</span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Error message */}
      {submitState === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-red-500 mt-0.5">⚠️</span>
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitState === 'loading'}
        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg hover:shadow-green-200 hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
      >
        {submitState === 'loading' ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando...
          </>
        ) : (
          <>
            <span>♻️</span>
            Enviar Solicitação de Descarte
          </>
        )}
      </button>
    </form>
  );
}
