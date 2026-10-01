import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { importarEntrevistas, type ResultadoImportacao } from "@/lib/entrevistas.functions";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [{ title: "Importar entrevistas em massa | Grupo RDZ" }],
  }),
  component: ImportarPage,
});

type LinhaPlanilha = Record<string, unknown>;

function ImportarPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [linhas, setLinhas] = useState<LinhaPlanilha[]>([]);
  const [processando, setProcessando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  async function handleArquivo(file: File) {
    setArquivo(file);
    setResultado(null);
    setLinhas([]);
    setProcessando(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const nomeAba = workbook.SheetNames[0];
      if (!nomeAba) throw new Error("A planilha não tem nenhuma aba.");
      const aba = workbook.Sheets[nomeAba]!;

      // sheet_to_json usa a linha 1 (cabeçalho técnico) para montar os
      // objetos; o 1º item do array corresponde à linha 2 (rótulos em
      // português) e o 2º à linha 3 (exemplo) — descartamos os dois.
      const todasAsLinhas = XLSX.utils.sheet_to_json<LinhaPlanilha>(aba, { defval: "" });
      const linhasDeDados = todasAsLinhas
        .slice(2)
        .filter((linha) => Object.values(linha).some((v) => String(v ?? "").trim() !== ""));

      setLinhas(linhasDeDados);
      if (!linhasDeDados.length) {
        toast.warning("Nenhuma linha de dados encontrada abaixo da linha de exemplo (linha 3).");
      } else {
        toast.success(
          `${linhasDeDados.length} ${linhasDeDados.length === 1 ? "linha encontrada" : "linhas encontradas"} — confira a prévia antes de importar.`,
        );
      }
    } catch (erro) {
      toast.error(
        `Não foi possível ler o arquivo: ${erro instanceof Error ? erro.message : "erro desconhecido"}`,
      );
    } finally {
      setProcessando(false);
    }
  }

  async function handleImportar() {
    if (!linhas.length) return;
    setImportando(true);
    try {
      const resposta = await importarEntrevistas({ data: { linhas } });
      setResultado(resposta);
      if (resposta.inseridas > 0) {
        toast.success(
          `${resposta.inseridas} ${resposta.inseridas === 1 ? "entrevista importada" : "entrevistas importadas"} com sucesso!`,
        );
      } else {
        toast.warning("Nenhuma linha pôde ser importada — veja os motivos abaixo.");
      }
      setLinhas([]);
      setArquivo(null);
    } catch (erro) {
      toast.error(
        `Falha ao importar: ${erro instanceof Error ? erro.message : "erro desconhecido"}`,
      );
    } finally {
      setImportando(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao painel
        </Link>

        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Importar entrevistas em massa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Baixe o template, preencha offline e envie o arquivo aqui. Você confere uma prévia
          antes de qualquer dado ser gravado.
        </p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-base font-semibold text-card-foreground">
            1. Baixe o template
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Planilha com as colunas certas, um exemplo de preenchimento e menus suspensos para os
            campos de avaliação.
          </p>
          <a
            href="/template-entrevistas-desligamento.xlsx"
            download
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="size-4" />
            Baixar template (.xlsx)
          </a>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-base font-semibold text-card-foreground">
            2. Envie o arquivo preenchido
          </h2>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:bg-muted/60">
            <FileSpreadsheet className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium text-card-foreground">
              {arquivo ? arquivo.name : "Clique para escolher o arquivo .xlsx preenchido"}
            </span>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                if (file) void handleArquivo(file);
                ev.target.value = "";
              }}
            />
          </label>
          {processando && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Lendo arquivo…
            </p>
          )}
        </section>

        {linhas.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-base font-semibold text-card-foreground">
              3. Confira e confirme
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {linhas.length} {linhas.length === 1 ? "linha encontrada" : "linhas encontradas"}.
              Prévia das 5 primeiras:
            </p>
            <div className="mt-3 overflow-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Nome</th>
                    <th className="px-3 py-2 font-medium">Função</th>
                    <th className="px-3 py-2 font-medium">Loja</th>
                    <th className="px-3 py-2 font-medium">Data/hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {linhas.slice(0, 5).map((linha, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-card-foreground">{String(linha['nome'] ?? "—")}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {String(linha['funcao'] ?? "—")}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {String(linha['franquia_loja'] ?? "—")}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {String(linha['carimbo_data_hora'] ?? "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => void handleImportar()}
              disabled={importando}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {importando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {importando
                ? "Importando…"
                : `Importar ${linhas.length} ${linhas.length === 1 ? "entrevista" : "entrevistas"}`}
            </button>
          </section>
        )}

        {resultado && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="flex items-center gap-2 text-sm font-semibold text-bom">
              <CheckCircle2 className="size-5" />
              {resultado.inseridas}{" "}
              {resultado.inseridas === 1 ? "entrevista importada" : "entrevistas importadas"}
            </p>
            {resultado.ignoradas > 0 && (
              <div className="mt-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-regular">
                  <AlertTriangle className="size-4" />
                  {resultado.ignoradas}{" "}
                  {resultado.ignoradas === 1 ? "linha ignorada" : "linhas ignoradas"}
                </p>
                <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  {resultado.motivosIgnoradas.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              to="/"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Ver no painel →
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
