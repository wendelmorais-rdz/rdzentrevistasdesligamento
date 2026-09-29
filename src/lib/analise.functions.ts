import { createServerFn } from "@tanstack/react-start";
import type { Sentimento, Tema } from "@/data/analise";
import type { Entrevista } from "@/data/entrevistas";
import { buscarEntrevistas } from "@/lib/entrevistas.functions";

export const PERIODOS = ["todos", "30d", "3m", "6m", "ano"] as const;
export type Periodo = (typeof PERIODOS)[number];

function filtrarPorPeriodo(entrevistas: Entrevista[], periodo: Periodo): Entrevista[] {
  if (periodo === "todos") return entrevistas;

  const agora = new Date();
  const inicio = new Date(agora);
  if (periodo === "30d") inicio.setDate(inicio.getDate() - 30);
  else if (periodo === "3m") inicio.setMonth(inicio.getMonth() - 3);
  else if (periodo === "6m") inicio.setMonth(inicio.getMonth() - 6);
  else inicio.setMonth(0, 1); // "ano": 1º de janeiro deste ano

  const inicioIso = inicio.toISOString().slice(0, 10);
  return entrevistas.filter((e) => e.data >= inicioIso);
}

export type MotivoRecomendacao = {
  motivosPositivos: string[];
  motivosNegativos: string[];
};

export type AlertaUrgente = {
  pessoa: string;
  resumo: string;
  origem: string;
};

export type AnaliseGerada = {
  respondentes: number;
  comSugestaoAcionavel: number;
  elogioNoLugarDeSugestao: number;
  semSugestao: number;
  observacao: string;
  temas: Tema[];
  recomendacao: MotivoRecomendacao;
  alertasUrgentes: AlertaUrgente[];
  geradoEm: string;
};

const SENTIMENTOS: Sentimento[] = ["critico", "atencao", "positivo"];

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "comSugestaoAcionavel",
    "elogioNoLugarDeSugestao",
    "semSugestao",
    "observacao",
    "temas",
    "recomendacao",
    "alertasUrgentes",
  ],
  properties: {
    comSugestaoAcionavel: { type: "integer" },
    elogioNoLugarDeSugestao: { type: "integer" },
    semSugestao: { type: "integer" },
    observacao: { type: "string" },
    recomendacao: {
      type: "object",
      additionalProperties: false,
      required: ["motivosPositivos", "motivosNegativos"],
      properties: {
        motivosPositivos: { type: "array", items: { type: "string" } },
        motivosNegativos: { type: "array", items: { type: "string" } },
      },
    },
    alertasUrgentes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pessoa", "resumo", "origem"],
        properties: {
          pessoa: { type: "string" },
          resumo: { type: "string" },
          origem: { type: "string" },
        },
      },
    },
    temas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "titulo",
          "resumo",
          "sentimento",
          "pessoas",
          "lojas",
          "criteriosLigados",
          "citacoes",
          "acoes",
        ],
        properties: {
          id: { type: "string" },
          titulo: { type: "string" },
          resumo: { type: "string" },
          sentimento: { type: "string", enum: SENTIMENTOS },
          pessoas: { type: "array", items: { type: "string" } },
          lojas: { type: "array", items: { type: "string" } },
          criteriosLigados: { type: "array", items: { type: "string" } },
          citacoes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["autor", "texto", "origem"],
              properties: {
                autor: { type: "string" },
                texto: { type: "string" },
                origem: { type: "string" },
              },
            },
          },
          acoes: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

const INSTRUCOES =
  "Você é analista de RH. Analise entrevistas de desligamento em português do Brasil, com foco na pergunta 'O que você deixaria como sugestão para o processo de melhoria da empresa?', cruzando com 'Sua saída poderia ter sido evitada?' e com as notas por critério. " +
  "Agrupe as respostas abertas em 4 a 8 temas, do mais crítico ao positivo. Use apenas informações presentes nos dados. " +
  "As citações devem ser trechos literais das respostas (pode encurtar, nunca inventar), com 'origem' igual a 'Sugestão de melhoria', 'Saída evitável', 'Trabalharia novamente' ou 'Indicaria a empresa'. " +
  "Em 'acoes', escreva de 2 a 3 ações concretas e mensuráveis. " +
  "Conte quantas pessoas deixaram sugestão acionável, quantas apenas elogiaram e quantas não deixaram sugestão. " +
  "'id' deve ser um slug curto e único sem acentos. " +
  "Em 'recomendacao', baseado nos campos 'trabalhariaNovamente' e 'indicaria', liste em 'motivosPositivos' de 3 a 6 motivos curtos (poucas palavras cada) mais citados por quem voltaria a trabalhar ou indicaria a empresa, e em 'motivosNegativos' de 3 a 6 motivos mais citados por quem não voltaria ou não indicaria. Use listas vazias se não houver dados suficientes para um dos lados — nunca invente motivo. " +
  "Em 'alertasUrgentes', liste casos individuais (um por pessoa) que mencionem risco grave exigindo atenção imediata do RH — por exemplo assédio, discriminação, ilegalidade, ou risco à segurança física ou saúde mental. Cada item tem 'pessoa' (nome), 'resumo' (uma frase objetiva do relato) e 'origem' (de qual campo veio). Retorne lista vazia se nenhum caso presente nos dados se encaixar — não force um alerta que não existe.";

export const gerarAnalise = createServerFn({ method: "GET" })
  .validator((entrada: { periodo?: Periodo } | undefined): { periodo: Periodo } => {
    const periodo = entrada?.periodo;
    return { periodo: periodo && PERIODOS.includes(periodo) ? periodo : "todos" };
  })
  .handler(async ({ data: { periodo } }): Promise<AnaliseGerada | null> => {
    const chave = process.env["OPENROUTER_API_KEY"];
    if (!chave) return null;

    const entrevistas = filtrarPorPeriodo(await buscarEntrevistas(), periodo);
    if (!entrevistas.length) return null;

    const material = entrevistas.map((e) => ({
      nome: e.nome,
      funcao: e.funcao,
      loja: e.loja,
      iniciativa: e.iniciativa,
      motivo: e.motivo,
      notas: e.notas,
      saidaEvitavel: e.evitavel,
      sugestaoDeMelhoria: e.sugestao,
      trabalhariaNovamente: e.voltaria,
      indicaria: e.indicaria,
    }));

    // O roteador gratuito do OpenRouter pode ficar sem responder por minutos;
    // sem um limite de tempo aqui, o fetch trava para sempre e a UI nunca sai
    // do estado "Analisando…".
    const controlador = new AbortController();
    const tempoEsgotado = setTimeout(() => controlador.abort(), 60_000);

    let resposta: Response;
    try {
      resposta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chave}`,
        },
        body: JSON.stringify({
          model: process.env["OPENROUTER_MODEL"] ?? "openrouter/free",
          messages: [
            { role: "system", content: INSTRUCOES },
            { role: "user", content: JSON.stringify(material, null, 2) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "analise_desligamento", strict: true, schema },
          },
        }),
        signal: controlador.signal,
      });
    } catch (erro) {
      if (erro instanceof Error && erro.name === "AbortError") {
        throw new Error("A análise demorou demais para responder (mais de 60s). Tente novamente.");
      }
      throw erro;
    } finally {
      clearTimeout(tempoEsgotado);
    }

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`Falha na análise (${resposta.status}): ${detalhe.slice(0, 300)}`);
    }

    const json = (await resposta.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const conteudo = json.choices?.[0]?.message?.content;
    if (!conteudo) return null;

    const bruto = JSON.parse(conteudo) as Omit<AnaliseGerada, "respondentes" | "geradoEm">;
    const temas = (bruto.temas ?? []).filter((t) => t.titulo && t.resumo);
    if (!temas.length) return null;

    return {
      respondentes: entrevistas.length,
      comSugestaoAcionavel: bruto.comSugestaoAcionavel ?? 0,
      elogioNoLugarDeSugestao: bruto.elogioNoLugarDeSugestao ?? 0,
      semSugestao: bruto.semSugestao ?? 0,
      observacao: bruto.observacao ?? "",
      temas,
      recomendacao: {
        motivosPositivos: bruto.recomendacao?.motivosPositivos ?? [],
        motivosNegativos: bruto.recomendacao?.motivosNegativos ?? [],
      },
      alertasUrgentes: bruto.alertasUrgentes ?? [],
      geradoEm: new Date().toISOString(),
    };
  },
);
