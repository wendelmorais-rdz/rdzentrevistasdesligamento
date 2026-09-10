import { createServerFn } from "@tanstack/react-start";
import type { Sentimento, Tema } from "@/data/analise";
import { buscarEntrevistas } from "@/lib/entrevistas.functions";

export type AnaliseGerada = {
  respondentes: number;
  comSugestaoAcionavel: number;
  elogioNoLugarDeSugestao: number;
  semSugestao: number;
  observacao: string;
  temas: Tema[];
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
  ],
  properties: {
    comSugestaoAcionavel: { type: "integer" },
    elogioNoLugarDeSugestao: { type: "integer" },
    semSugestao: { type: "integer" },
    observacao: { type: "string" },
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

export const gerarAnalise = createServerFn({ method: "GET" }).handler(
  async (): Promise<AnaliseGerada | null> => {
    const chave = process.env["LOVABLE_API_KEY"];
    if (!chave) return null;

    const entrevistas = await buscarEntrevistas();
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

    const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": chave,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é analista de RH. Analise entrevistas de desligamento em português do Brasil, com foco na pergunta 'O que você deixaria como sugestão para o processo de melhoria da empresa?', cruzando com 'Sua saída poderia ter sido evitada?' e com as notas por critério. " +
              "Agrupe as respostas abertas em 4 a 8 temas, do mais crítico ao positivo. Use apenas informações presentes nos dados. " +
              "As citações devem ser trechos literais das respostas (pode encurtar, nunca inventar), com 'origem' igual a 'Sugestão de melhoria', 'Saída evitável' ou 'Indicaria a empresa'. " +
              "Em 'acoes', escreva de 2 a 3 ações concretas e mensuráveis. " +
              "Conte quantas pessoas deixaram sugestão acionável, quantas apenas elogiaram e quantas não deixaram sugestão. " +
              "'id' deve ser um slug curto e único sem acentos.",
          },
          { role: "user", content: JSON.stringify(material, null, 2) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "analise_desligamento", strict: true, schema },
        },
      }),
    });

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
      geradoEm: new Date().toISOString(),
    };
  },
);
