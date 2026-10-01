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

export function paraIso(valor: string): string | null {
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10);
  return null;
}

export function mapearEntrevista(linha: LinhaEntrevista): Entrevista {
  const notas = Object.fromEntries(
    CRITERIOS.map((c, i) => [c, paraNota(linha[COLUNAS_AVALIACAO[i]!])]),
  ) as Record<Criterio, Nota>;

  const solicitou = (linha.quem_solicitou_dispensa ?? "").toLowerCase();

  return {
    ...(linha.carimbo_data_hora ? { id: linha.carimbo_data_hora } : {}),
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

export async function buscarEntrevistas(): Promise<Entrevista[]> {
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
}

export const listarEntrevistas = createServerFn({ method: "GET" }).handler(
  async (): Promise<Entrevista[]> => buscarEntrevistas(),
);

export const excluirEntrevista = createServerFn({ method: "POST" })
  .validator((entrada: { id: string }) => entrada)
  .handler(async ({ data: { id } }): Promise<{ ok: boolean }> => {
    const url = process.env["EXT_SUPABASE_URL"];
    const key = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Banco não configurado.");
    if (!id) throw new Error("Entrevista sem identificador — não é possível excluir.");

    const resposta = await fetch(
      `${url}/rest/v1/Entrevistadesligamento?carimbo_data_hora=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "return=minimal",
        },
      },
    );
    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`Falha ao excluir (${resposta.status}): ${detalhe.slice(0, 300)}`);
    }
    return { ok: true };
  });

function paraIsoCompleto(valor: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) return valor;
  const iso = paraIso(valor);
  return iso ? `${iso}T00:00:00.000Z` : null;
}

export type ResultadoImportacao = {
  inseridas: number;
  ignoradas: number;
  motivosIgnoradas: string[];
};

// Recebe as linhas já lidas da planilha no navegador (cada uma é um objeto
// {nome_da_coluna: valor}, nos mesmos nomes de coluna do Supabase — é
// exatamente o que o template de importação gera). Limpa e grava em lote.
export const importarEntrevistas = createServerFn({ method: "POST" })
  .validator((entrada: { linhas: Record<string, unknown>[] }) => entrada)
  .handler(async ({ data: { linhas } }): Promise<ResultadoImportacao> => {
    const url = process.env["EXT_SUPABASE_URL"];
    const key = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Banco não configurado.");

    const permitidas = new Set<string>(COLUNAS);
    const validas: LinhaEntrevista[] = [];
    const motivosIgnoradas: string[] = [];

    linhas.forEach((bruto, indice) => {
      const linha: LinhaEntrevista = {};
      for (const [chaveBruta, valor] of Object.entries(bruto)) {
        if (!permitidas.has(chaveBruta)) continue;
        const chave = chaveBruta as (typeof COLUNAS)[number];
        if (valor === null || valor === undefined) continue;
        const texto = String(valor).slice(0, 4000).trim();
        if (!texto) continue;

        if (chave === "data_admissao" || chave === "data_demissao") {
          const iso = paraIso(texto);
          if (iso) linha[chave] = iso;
          continue;
        }
        if (chave === "carimbo_data_hora") {
          const iso = paraIsoCompleto(texto);
          if (iso) linha.carimbo_data_hora = iso;
          continue;
        }
        linha[chave] = texto;
      }

      if (!linha.nome) {
        motivosIgnoradas.push(`Linha ${indice + 1} da planilha: sem o campo "nome"`);
        return;
      }
      if (!linha.carimbo_data_hora) linha.carimbo_data_hora = new Date().toISOString();
      validas.push(linha);
    });

    if (!validas.length) {
      return { inseridas: 0, ignoradas: motivosIgnoradas.length, motivosIgnoradas };
    }

    // O insert em lote do PostgREST exige que todo objeto do array tenha
    // exatamente o mesmo conjunto de chaves — senão rejeita o lote inteiro
    // com "All object keys must match" (PGRST102). Como cada entrevista deixa
    // perguntas diferentes em branco, preenchemos as colunas ausentes com
    // null em vez de omiti-las.
    const completas = validas.map((linha) =>
      Object.fromEntries(COLUNAS.map((coluna) => [coluna, linha[coluna] ?? null])),
    );

    const resposta = await fetch(`${url}/rest/v1/Entrevistadesligamento`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(completas),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`Falha ao importar (${resposta.status}): ${detalhe.slice(0, 300)}`);
    }

    return { inseridas: validas.length, ignoradas: motivosIgnoradas.length, motivosIgnoradas };
  });

