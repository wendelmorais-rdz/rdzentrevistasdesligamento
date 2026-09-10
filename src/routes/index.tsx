import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CRITERIOS,
  ENTREVISTAS,
  PESO,
  type Criterio,
  type Entrevista,
  type Nota,
} from "@/data/entrevistas";
import { LEITURA_SUGESTOES, TEMAS, type Sentimento } from "@/data/analise";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Entrevistas de Desligamento | Grupo RDZ" },
      {
        name: "description",
        content:
          "Painel de RH com indicadores das entrevistas de desligamento do Grupo RDZ: iniciativa, motivos, avaliação por critério e depoimentos.",
      },
      { property: "og:title", content: "Painel de Entrevistas de Desligamento | Grupo RDZ" },
      {
        property: "og:description",
        content:
          "Indicadores e depoimentos das entrevistas de desligamento do Grupo RDZ em um único painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const NOTAS: Nota[] = ["Excelente", "Bom", "Regular", "Insuficiente"];

const notaClasse: Record<Nota, string> = {
  Excelente: "bg-excelente",
  Bom: "bg-bom",
  Regular: "bg-regular",
  Insuficiente: "bg-insuficiente",
};

const notaTexto: Record<Nota, string> = {
  Excelente: "text-excelente",
  Bom: "text-bom",
  Regular: "text-regular",
  Insuficiente: "text-insuficiente",
};

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {title && (
        <header className="mb-4">
          <h2 className="font-display text-base font-semibold tracking-tight text-card-foreground">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-card-foreground">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const registros = Route.useLoaderData();
  const [aberta, setAberta] = useState<string | null>(null);

  const dados: Entrevista[] = useMemo(
    () => (registros.length ? registros : ENTREVISTAS),
    [registros],
  );

  const total = dados.length;
  const porColaborador = dados.filter((e) => e.iniciativa === "Colaborador").length;
  const indicariam = dados.filter((e) => /^sim|indicaria tanto|com certeza/i.test(e.indicaria)).length;

  const mediaGeral = useMemo(() => {
    if (!total) return 0;
    const soma = dados.reduce(
      (acc, e) => acc + CRITERIOS.reduce((a, c) => a + PESO[e.notas[c]], 0),
      0,
    );
    return soma / (total * CRITERIOS.length);
  }, [dados, total]);

  const porCriterio = useMemo(
    () =>
      CRITERIOS.map((c) => {
        const contagem = NOTAS.map((nota) => ({
          nota,
          qtd: dados.filter((e) => e.notas[c] === nota).length,
        }));
        const media = total
          ? dados.reduce((a, e) => a + PESO[e.notas[c]], 0) / total
          : 0;
        return { criterio: c as Criterio, contagem, media };
      }).sort((a, b) => a.media - b.media),
    [dados, total],
  );

  const motivos = useMemo(() => {
    const map = new Map<string, number>();
    dados.forEach((e) => {
      const k = e.motivo ?? "Não informado (dispensa pelo empregador)";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dados]);

  const tempoMedio = useMemo(() => {
    const meses = dados
      .map((e) => {
        const p = (s: string) => {
          const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
        };
        const a = p(e.admissao);
        const d = p(e.demissao);
        return a && d ? (d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.4) : null;
      })
      .filter((v): v is number => v !== null);
    return meses.length ? meses.reduce((a, b) => a + b, 0) / meses.length : 0;
  }, [dados]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Grupo RDZ · Recursos Humanos
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Painel de Entrevistas de Desligamento
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Respostas coletadas entre 23 e 26 de janeiro de 2026.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Franquia / Loja
            <select
              value={loja}
              onChange={(ev) => setLoja(ev.target.value)}
              className="min-w-52 rounded-xl border border-border bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-card-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {lojas.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Entrevistas" value={String(total)} hint="Formulários respondidos" />
          <Kpi
            label="Pedidos de demissão"
            value={`${porColaborador}/${total}`}
            hint="Saídas por iniciativa do colaborador"
          />
          <Kpi
            label="Nota média geral"
            value={mediaGeral ? `${mediaGeral.toFixed(1)} / 4` : "—"}
            hint="Média de todos os critérios avaliados"
          />
          <Kpi
            label="Recomendariam a empresa"
            value={`${indicariam}/${total}`}
            hint={`Tempo médio de casa: ${tempoMedio.toFixed(1)} meses`}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card
            title="Avaliação por critério"
            subtitle="Do critério mais frágil para o mais bem avaliado"
            className="lg:col-span-2"
          >
            <div className="space-y-3">
              {porCriterio.map(({ criterio, contagem, media }) => (
                <div key={criterio}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-card-foreground">{criterio}</span>
                    <span className="font-display text-xs font-semibold text-muted-foreground">
                      {media.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                    {contagem.map(
                      ({ nota, qtd }) =>
                        qtd > 0 && (
                          <div
                            key={nota}
                            title={`${nota}: ${qtd}`}
                            className={`${notaClasse[nota]} h-full`}
                            style={{ width: `${(qtd / (total || 1)) * 100}%` }}
                          />
                        ),
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4">
              {NOTAS.map((nota) => (
                <span key={nota} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`size-2.5 rounded-full ${notaClasse[nota]}`} />
                  {nota}
                </span>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Iniciativa do desligamento">
              <div className="space-y-3">
                {(["Colaborador", "Empregador"] as const).map((tipo) => {
                  const qtd = dados.filter((e) => e.iniciativa === tipo).length;
                  return (
                    <div key={tipo}>
                      <div className="flex justify-between text-sm text-card-foreground">
                        <span>{tipo === "Colaborador" ? "Pedido do colaborador" : "Pela empresa"}</span>
                        <span className="font-display font-semibold">{qtd}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(qtd / (total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card title="Motivos declarados">
              <ul className="space-y-2">
                {motivos.map(([motivo, qtd]) => (
                  <li
                    key={motivo}
                    className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2 text-sm text-secondary-foreground"
                  >
                    <span>{motivo}</span>
                    <span className="font-display font-semibold">{qtd}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <AnaliseSugestoes />


        <Card
          title="Entrevistas individuais"
          subtitle="Clique em uma pessoa para ler os comentários completos"
          className="mt-6"
        >
          <ul className="divide-y divide-border">
            {dados.map((e) => {
              const aberto = aberta === e.nome;
              return (
                <li key={e.nome} className="py-3">
                  <button
                    onClick={() => setAberta(aberto ? null : e.nome)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  >
                    <span>
                      <span className="block text-sm font-medium text-card-foreground">
                        {e.nome}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {e.funcao} · {e.loja} · {e.admissao} a {e.demissao}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold ${notaTexto[e.notas["Classificação geral"]]}`}
                      >
                        {e.notas["Classificação geral"]}
                      </span>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                        {e.iniciativa === "Colaborador" ? "Pediu demissão" : "Dispensa"}
                      </span>
                    </span>
                  </button>
                  {aberto && (
                    <div className="mt-3 grid gap-4 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
                      <Bloco titulo="Poderia ter sido evitada?" texto={e.evitavel} />
                      <Bloco titulo="Sugestão de melhoria" texto={e.sugestao} />
                      <Bloco titulo="Trabalharia novamente?" texto={e.voltaria} />
                      <Bloco titulo="Indicaria a um amigo?" texto={e.indicaria} />
                      <div className="sm:col-span-2">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Notas por critério
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {CRITERIOS.map((c) => (
                            <span
                              key={c}
                              className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-card-foreground"
                            >
                              {c}
                              <span className={`ml-1.5 font-semibold ${notaTexto[e.notas[c]]}`}>
                                {e.notas[c]}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </main>
  );
}

function AnaliseSugestoes() {
  const [ativo, setAtivo] = useState<string>(TEMAS[0]!.id);
  const tema = TEMAS.find((t) => t.id === ativo) ?? TEMAS[0]!;

  const cor: Record<Sentimento, string> = {
    critico: "bg-insuficiente",
    atencao: "bg-regular",
    positivo: "bg-bom",
  };
  const rotulo: Record<Sentimento, string> = {
    critico: "Crítico",
    atencao: "Atenção",
    positivo: "Preservar",
  };

  return (
    <Card
      title="Análise das sugestões de melhoria"
      subtitle="Respostas abertas agrupadas por tema, cruzadas com a pergunta sobre saída evitável e com as notas por critério"
      className="mt-6"
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Respondentes", LEITURA_SUGESTOES.respondentes],
          ["Sugestões acionáveis", LEITURA_SUGESTOES.comSugestaoAcionavel],
          ["Elogio no lugar de sugestão", LEITURA_SUGESTOES.elogioNoLugarDeSugestao],
          ["Sem sugestão", LEITURA_SUGESTOES.semSugestao],
        ].map(([label, valor]) => (
          <div key={String(label)} className="rounded-xl bg-secondary px-4 py-3">
            <p className="font-display text-2xl font-semibold text-secondary-foreground">{valor}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {LEITURA_SUGESTOES.observacao}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <ul className="space-y-2">
          {TEMAS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setAtivo(t.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  t.id === ativo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${cor[t.sentimento]}`} />
                <span>
                  <span className="block text-sm font-medium">{t.titulo}</span>
                  <span
                    className={`block text-xs ${t.id === ativo ? "opacity-80" : "text-muted-foreground"}`}
                  >
                    {t.pessoas.length}{" "}
                    {t.pessoas.length === 1 ? "relato" : "relatos"} · {rotulo[t.sentimento]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-border bg-muted/50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold text-card ${cor[tema.sentimento]}`}
            >
              {rotulo[tema.sentimento]}
            </span>
            {tema.lojas.map((l) => (
              <span
                key={l}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-card-foreground"
              >
                {l}
              </span>
            ))}
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-card-foreground">
            {tema.titulo}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground">{tema.resumo}</p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            O que foi dito
          </p>
          <div className="mt-2 space-y-3">
            {tema.citacoes.map((c) => (
              <blockquote
                key={c.texto}
                className="rounded-xl border-l-2 border-accent bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground"
              >
                “{c.texto}”
                <footer className="mt-1.5 text-xs text-muted-foreground">
                  {c.autor} · {c.origem}
                </footer>
              </blockquote>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Critérios impactados
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tema.criteriosLigados.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-card-foreground"
              >
                {c}
              </span>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ações recomendadas
          </p>
          <ul className="mt-2 space-y-2">
            {tema.acoes.map((a) => (
              <li key={a} className="flex gap-2 text-sm leading-relaxed text-card-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-1 leading-relaxed text-card-foreground">{texto}</p>
    </div>
  );
}
