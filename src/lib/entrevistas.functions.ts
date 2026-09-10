import { createServerFn } from "@tanstack/react-start";
import { CRITERIOS, type Criterio, type Entrevista, type Nota } from "@/data/entrevistas";

export const COLUNAS_AVALIACAO = [
  "avaliacao_comunicacao_interna",
  "avaliacao_estrutura_fisica",
  "avaliacao_recursos_trabalho",
  "avaliacao_escala_turno",
  "avaliacao_normas_regras_valores_cultura",
  "avaliacao_relacionamento_colegas",
  "avaliacao_lideranca_direta",
  "avaliacao_gestores",
  "avaliacao_remuneracao",
  "avaliacao_beneficios",
  "avaliacao_empresa_geral",
] as const;

export const COLUNAS = [
  "carimbo_data_hora",
  "endereco_email",
  "nome",
  "funcao",
  "franquia_loja",
  "data_admissao",
  "data_demissao",
  "quem_solicitou_dispensa",
  "motivo_desligamento",
  "outra_colocacao_segmento",
  ...COLUNAS_AVALIACAO,
  "saida_poderia_ser_evitada",
  "sugestao_melhoria",
  "trabalharia_novamente_area_atividade",
  "indicaria_empresa_motivo",
  "campo_adicional",
] as const;

export type LinhaEntrevista = Partial<Record<(typeof COLUNAS)[number], string | null>>;

const NOTAS_VALIDAS: Nota[] = ["Excelente", "Bom", "Regular", "Insuficiente"];

function paraNota(valor: string | null | undefined): Nota {
  const v = (valor ?? "").trim().toLowerCase();
  return NOTAS_VALIDAS.find((n) => n.toLowerCase() === v) ?? "Regular";
}

function paraBr(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function limpar(v: string | null | undefined): string | null {
  const s = (v ?? "").replace(/;\s*$/, "").trim();
  return s.length ? s : null;
}

export function mapearEntrevista(linha: LinhaEntrevista): Entrevista {
  const notas = Object.fromEntries(
    CRITERIOS.map((c, i) => [c, paraNota(linha[COLUNAS_AVALIACAO[i]!])]),
  ) as Record<Criterio, Nota>;

  const solicitou = (linha.quem_solicitou_dispensa ?? "").toLowerCase();

  return {
    data: (linha.carimbo_data_hora ?? "").slice(0, 10),
    nome: limpar(linha.nome) ?? "Sem identificação",
    funcao: limpar(linha.funcao) ?? "—",
    loja: limpar(linha.franquia_loja) ?? "—",
    admissao: paraBr(linha.data_admissao),
    demissao: paraBr(linha.data_demissao),
    iniciativa: solicitou.includes("colaborador") ? "Colaborador" : "Empregador",
    motivo: limpar(linha.motivo_desligamento),
    novaColocacao: limpar(linha.outra_colocacao_segmento),
    notas,
    evitavel: limpar(linha.saida_poderia_ser_evitada) ?? "—",
    sugestao: limpar(linha.sugestao_melhoria) ?? "—",
    voltaria: limpar(linha.trabalharia_novamente_area_atividade) ?? "—",
    indicaria: limpar(linha.indicaria_empresa_motivo) ?? "—",
  };
}

export const listarEntrevistas = createServerFn({ method: "GET" }).handler(
  async (): Promise<Entrevista[]> => {
    const url = process.env["EXT_SUPABASE_URL"];
    const key = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) return [];

    const resposta = await fetch(
      `${url}/rest/v1/Entrevistadesligamento?select=*&order=carimbo_data_hora.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!resposta.ok) return [];

    const linhas = (await resposta.json()) as LinhaEntrevista[];
    return Array.isArray(linhas) ? linhas.map(mapearEntrevista) : [];
  },
);
