import { createFileRoute } from "@tanstack/react-router";
import { COLUNAS, paraIso, type LinhaEntrevista } from "@/lib/entrevistas.functions";

const ALIASES: Record<string, (typeof COLUNAS)[number]> = {
  email: "endereco_email",
  e_mail: "endereco_email",
  loja: "franquia_loja",
  franquia: "franquia_loja",
  cargo: "funcao",
  admissao: "data_admissao",
  demissao: "data_demissao",
  motivo: "motivo_desligamento",
  sugestao: "sugestao_melhoria",
  observacoes: "campo_adicional",
};

function normalizar(chave: string): string {
  return chave
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const Route = createFileRoute("/api/public/typebot-webhook")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
      POST: async ({ request }) => {
        const cors = { "Access-Control-Allow-Origin": "*" };
        const url = process.env["EXT_SUPABASE_URL"];
        const key = process.env["EXT_SUPABASE_SERVICE_ROLE_KEY"];
        if (!url || !key) {
          return Response.json({ erro: "Banco não configurado" }, { status: 500, headers: cors });
        }

        let bruto: unknown;
        try {
          bruto = await request.json();
        } catch {
          return Response.json({ erro: "JSON inválido" }, { status: 400, headers: cors });
        }
        if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
          return Response.json({ erro: "Payload inválido" }, { status: 400, headers: cors });
        }

        const permitidas = new Set<string>(COLUNAS);
        const linha: LinhaEntrevista = {};

        for (const [chave, valor] of Object.entries(bruto as Record<string, unknown>)) {
          if (valor === null || valor === undefined) continue;
          const n = normalizar(chave);
          const coluna = permitidas.has(n)
            ? (n as (typeof COLUNAS)[number])
            : ALIASES[n];
          if (!coluna) continue;
          const texto = String(Array.isArray(valor) ? valor.join("; ") : valor).slice(0, 4000).trim();
          if (!texto) continue;
          if (coluna === "data_admissao" || coluna === "data_demissao") {
            const iso = paraIso(texto);
            if (iso) linha[coluna] = iso;
            continue;
          }
          linha[coluna] = texto;
        }

        if (!linha.nome) {
          return Response.json({ erro: "Campo 'nome' é obrigatório" }, { status: 400, headers: cors });
        }
        if (!linha.carimbo_data_hora) linha.carimbo_data_hora = new Date().toISOString();

        const resposta = await fetch(`${url}/rest/v1/Entrevistadesligamento`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(linha),
        });

        if (!resposta.ok) {
          const detalhe = await resposta.text();
          return Response.json(
            { erro: "Falha ao gravar", detalhe: detalhe.slice(0, 500) },
            { status: 502, headers: cors },
          );
        }

        return Response.json({ ok: true, campos: Object.keys(linha).length }, { headers: cors });
      },
    },
  },
});
