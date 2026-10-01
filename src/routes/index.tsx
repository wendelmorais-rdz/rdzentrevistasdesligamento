import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  CRITERIOS,
  ENTREVISTAS,
  PESO,
  type Criterio,
  type Entrevista,
  type Nota,
} from "@/data/entrevistas";
import { LEITURA_SUGESTOES, TEMAS, type Sentimento } from "@/data/analise";
import { listarEntrevistas, excluirEntrevista } from "@/lib/entrevistas.functions";
import { gerarAnalise, PERIODOS, type Periodo } from "@/lib/analise.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

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
  loader: async () => {
    try {
      return await listarEntrevistas();
    } catch {
      return [] as Entrevista[];
    }
  },
  errorComponent: () => (
    <main className="grid min-h-screen place-items-center p-8 text-center text-sm text-muted-foreground">
      Não foi possível carregar as entrevistas agora. Atualize a página em instantes.
    </main>
  ),
  notFoundComponent: () => (
    <main className="grid min-h-screen place-items-center p-8 text-sm text-muted-foreground">
      Página não encontrada.
    </main>
  ),
  component: Dashboard,
});

const NOTAS: Nota[] = ["Excelente", "Bom", "Regular", "Insuficiente"];

const notaClasse: Record<Nota, string> = {
  Excelente: "bg-excelente",
  Bom: "bg-bom",
  Regular: "bg-regular",
  Insuficiente: "bg-insuficiente",
};

function corPorMedia(media: number): string {
  if (media >= 3.5) return "bg-excelente";
  if (media >= 2.5) return "bg-bom";
  if (media >= 1.5) return "bg-regular";
  return "bg-insuficiente";
}

// % evitável alto é uma notícia boa: significa que a saída tinha solução ao
// alcance da empresa. 0% evitável é o pior caso — ninguém viu como reter.
function corPorPctEvitavel(pct: number): string {
  if (pct === 0) return "bg-insuficiente";
  if (pct < 33) return "bg-regular";
  if (pct < 66) return "bg-bom";
  return "bg-excelente";
}

const notaTexto: Record<Nota, string> = {
  Excelente: "text-excelente",
  Bom: "text-bom",
  Regular: "text-regular",
  Insuficiente: "text-insuficiente",
};

function Card({
  title,
  subtitle,
  badge,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {title && (
        <header className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold tracking-tight text-card-foreground">
              {title}
            </h2>
            {badge}
          </div>
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [aberta, setAberta] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [alvoExclusao, setAlvoExclusao] = useState<Entrevista | null>(null);

  async function handleExcluir(entrevista: Entrevista) {
    if (!entrevista.id) return;

    setExcluindo(entrevista.id);
    try {
      await excluirEntrevista({ data: { id: entrevista.id } });
      toast.success(`Entrevista de ${entrevista.nome} excluída.`);
      await router.invalidate();
      await queryClient.invalidateQueries({ queryKey: ["analise-sugestoes"] });
    } catch (erro) {
      toast.error(
        `Não foi possível excluir: ${erro instanceof Error ? erro.message : "erro desconhecido"}`,
      );
    } finally {
      setExcluindo(null);
    }
  }

  const dados: Entrevista[] = useMemo(
    () =>
      [...(registros.length ? registros : ENTREVISTAS)].sort((a, b) =>
        b.data.localeCompare(a.data),
      ),
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

  const pareceSim = (texto: string) => /^sim/i.test(texto.trim());

  const cruzamentoMotivo = useMemo(() => {
    const grupos = new Map<string, Entrevista[]>();
    dados.forEach((e) => {
      const k = e.motivo ?? "Não informado (dispensa pelo empregador)";
      grupos.set(k, [...(grupos.get(k) ?? []), e]);
    });
    return Array.from(grupos.entries())
      .map(([motivo, entrevistas]) => ({
        motivo,
        qtd: entrevistas.length,
        pctEvitavel:
          (entrevistas.filter((e) => pareceSim(e.evitavel)).length / entrevistas.length) * 100,
      }))
      .sort((a, b) => a.pctEvitavel - b.pctEvitavel);
  }, [dados]);

  const tempoPorMotivoColaborador = useMemo(() => {
    const parse = (s: string) => {
      const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
    };
    const grupos = new Map<string, number[]>();
    dados
      .filter((e) => e.iniciativa === "Colaborador")
      .forEach((e) => {
        const a = parse(e.admissao);
        const d = parse(e.demissao);
        if (!a || !d) return;
        const meses = Math.max(0, (d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.4));
        const k = e.motivo ?? "Não informado";
        grupos.set(k, [...(grupos.get(k) ?? []), meses]);
      });
    return Array.from(grupos.entries())
      .map(([motivo, lista]) => ({
        motivo,
        qtd: lista.length,
        mesesMedio: lista.reduce((a, b) => a + b, 0) / lista.length,
      }))
      .sort((a, b) => a.mesesMedio - b.mesesMedio);
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
          <div className="flex flex-col items-end gap-2">
            <Link
              to="/importar"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-secondary"
            >
              <Upload className="size-3.5" />
              Importar em massa
            </Link>
            <img
              src="/logo-rdz.png"
              alt="Logo Grupo RDZ"
              className="h-16 w-auto object-contain sm:h-20"
            />
          </div>
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card
            title="Motivo × avaliação"
            subtitle="% de saída evitável, por motivo declarado"
          >
            <div className="space-y-3">
              {cruzamentoMotivo.map(({ motivo, qtd, pctEvitavel }) => (
                <div key={motivo}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-card-foreground">
                      {motivo} <span className="text-xs text-muted-foreground">({qtd})</span>
                    </span>
                    <span className="shrink-0 font-display text-xs font-semibold text-muted-foreground">
                      {Math.round(pctEvitavel)}% evitável
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${corPorPctEvitavel(pctEvitavel)}`}
                      style={{ width: `${Math.max(pctEvitavel, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Tempo de casa × motivo"
            subtitle="Tempo médio de casa por motivo declarado, entre quem pediu demissão"
          >
            {tempoPorMotivoColaborador.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pedido de demissão com datas de admissão e demissão preenchidas ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const maxMeses = Math.max(1, ...tempoPorMotivoColaborador.map((g) => g.mesesMedio));
                  return tempoPorMotivoColaborador.map(({ motivo, qtd, mesesMedio }) => (
                    <div key={motivo}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm text-card-foreground">
                          {motivo} <span className="text-xs text-muted-foreground">({qtd})</span>
                        </span>
                        <span className="shrink-0 font-display text-xs font-semibold text-muted-foreground">
                          {formatarMeses(mesesMedio)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(mesesMedio / maxMeses) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </Card>
        </div>

        <AnaliseSugestoes total={dados.length} />


        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Card
            title="Entrevistas individuais"
            subtitle="Clique em uma pessoa para ler os comentários completos"
          >
          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto pr-1">
            {dados.map((e) => {
              const aberto = aberta === e.nome;
              return (
                <li key={e.id ?? e.nome} className="py-3">
                  <div className="flex w-full items-center gap-2">
                    <button
                      onClick={() => setAberta(aberto ? null : e.nome)}
                      className="flex flex-1 flex-wrap items-center justify-between gap-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-medium text-card-foreground">
                          {e.nome}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {formatarData(e.data)}
                          </span>
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {e.funcao} · {e.loja} · {tempoDeCasa(e.admissao, e.demissao)}
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
                    {e.id && (
                      <button
                        onClick={() => setAlvoExclusao(e)}
                        disabled={excluindo === e.id}
                        title="Excluir entrevista"
                        aria-label={`Excluir entrevista de ${e.nome}`}
                        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-insuficiente/10 hover:text-insuficiente disabled:opacity-50"
                      >
                        {excluindo === e.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    )}
                  </div>
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

          <div className="space-y-6">
            <Card
              title="Pessoas que pediram demissão"
              subtitle="Classificação geral dada à empresa"
              badge={
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  Avaliação Geral
                </span>
              }
            >
              <Pizza dados={dados.filter((e) => e.iniciativa === "Colaborador")} />
            </Card>
            <Card
              title="Pessoas que foram dispensadas"
              subtitle="Classificação geral dada à empresa"
              badge={
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  Avaliação Geral
                </span>
              }
            >
              <Pizza dados={dados.filter((e) => e.iniciativa !== "Colaborador")} />
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!alvoExclusao} onOpenChange={(open) => !open && setAlvoExclusao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta entrevista?</AlertDialogTitle>
            <AlertDialogDescription>
              A entrevista de <strong>{alvoExclusao?.nome}</strong> será apagada do banco de
              dados permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (alvoExclusao) void handleExcluir(alvoExclusao);
                setAlvoExclusao(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function formatarData(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "Data não informada";
}

function tempoDeCasa(admissao: string, demissao: string) {
  const p = (s: string) => {
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
  };
  const a = p(admissao);
  const d = p(demissao);
  if (!a || !d) return "Tempo de casa não informado";
  const meses = Math.max(
    0,
    Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.4)),
  );
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (meses < 1) return "Menos de 1 mês de casa";
  const partes = [
    anos ? `${anos} ${anos === 1 ? "ano" : "anos"}` : null,
    resto ? `${resto} ${resto === 1 ? "mês" : "meses"}` : null,
  ].filter(Boolean);
  return `${partes.join(" e ")} de casa`;
}

function formatarMeses(meses: number): string {
  const arredondado = Math.round(meses);
  if (arredondado < 1) return "Menos de 1 mês";
  const anos = Math.floor(arredondado / 12);
  const resto = arredondado % 12;
  const partes = [
    anos ? `${anos} ${anos === 1 ? "ano" : "anos"}` : null,
    resto ? `${resto} ${resto === 1 ? "mês" : "meses"}` : null,
  ].filter(Boolean);
  return partes.join(" e ");
}

const notaCor: Record<Nota, string> = {
  Excelente: "var(--excelente)",
  Bom: "var(--bom)",
  Regular: "var(--regular)",
  Insuficiente: "var(--insuficiente)",
};

function Pizza({ dados }: { dados: Entrevista[] }) {
  const total = dados.length;
  if (!total) {
    return <p className="text-sm text-muted-foreground">Sem registros neste grupo.</p>;
  }

  const fatias = NOTAS.map((nota) => {
    const qtd = dados.filter((e) => e.notas["Classificação geral"] === nota).length;
    return { nota, qtd, pct: (qtd / total) * 100 };
  }).filter((f) => f.qtd > 0);

  let acumulado = 0;
  const stops = fatias
    .map((f) => {
      const inicio = acumulado;
      acumulado += f.pct;
      return `${notaCor[f.nota]} ${inicio}% ${acumulado}%`;
    })
    .join(", ");

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="size-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
        role="img"
        aria-label={fatias.map((f) => `${f.nota} ${Math.round(f.pct)}%`).join(", ")}
      />
      <ul className="space-y-1.5 text-xs">
        {fatias.map((f) => (
          <li key={f.nota} className="flex items-center gap-2 text-muted-foreground">
            <span
              className="size-2.5 rounded-full"
              style={{ background: notaCor[f.nota] }}
            />
            <span className="text-card-foreground">{f.nota}</span>
            <span className="font-display font-semibold">{Math.round(f.pct)}%</span>
            <span>({f.qtd})</span>
          </li>
        ))}
      </ul>
      <p className="w-full text-xs text-muted-foreground">
        Base: {total} {total === 1 ? "pessoa" : "pessoas"}
      </p>
    </div>
  );
}


const ROTULO_PERIODO: Record<Periodo, string> = {
  todos: "Todos",
  "30d": "30 dias",
  "3m": "3 meses",
  "6m": "6 meses",
  ano: "Este ano",
};

function AnaliseSugestoes({ total }: { total: number }) {
  const [periodo, setPeriodo] = useState<Periodo>("todos");

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["analise-sugestoes", periodo],
    queryFn: () => gerarAnalise({ data: { periodo } }),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const temas = data?.temas?.length ? data.temas : TEMAS;
  const leitura = data
    ? {
        comSugestaoAcionavel: data.comSugestaoAcionavel,
        elogioNoLugarDeSugestao: data.elogioNoLugarDeSugestao,
        semSugestao: data.semSugestao,
        observacao: data.observacao,
      }
    : LEITURA_SUGESTOES;

  const [ativo, setAtivo] = useState<string>("");
  const tema = temas.find((t) => t.id === ativo) ?? temas[0]!;

  const cor: Record<Sentimento, string> = {
    critico: "bg-insuficiente",
    atencao: "bg-regular",
    positivo: "bg-bom",
  };
  const corTexto: Record<Sentimento, string> = {
    critico: "text-insuficiente",
    atencao: "text-regular",
    positivo: "text-bom",
  };
  const rotulo: Record<Sentimento, string> = {
    critico: "Crítico",
    atencao: "Atenção",
    positivo: "Preservar",
  };
  const icone: Record<Sentimento, React.ReactNode> = {
    critico: <AlertOctagon className="size-5" />,
    atencao: <AlertTriangle className="size-5" />,
    positivo: <CheckCircle2 className="size-5" />,
  };

  return (
    <Card
      title="Análise das sugestões de melhoria"
      subtitle="Respostas abertas agrupadas por tema, cruzadas com a pergunta sobre saída evitável e com as notas por critério"
      className="mt-6"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            toast.promise(
              refetch().then((resultado) => {
                if (resultado.error) throw resultado.error;
                return resultado.data;
              }),
              {
                loading: "⏳ Analisando as respostas…",
                success: "✅ Análise atualizada com sucesso!",
                error: (erro) =>
                  `⚠️ Não foi possível gerar a análise: ${
                    erro instanceof Error ? erro.message : "erro desconhecido"
                  }`,
              },
            );
          }}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isFetching && <Loader2 className="size-4 animate-spin" />}
          {isFetching ? "Analisando…" : "Refazer análise"}
        </button>
        <div className="flex flex-wrap gap-1.5">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              disabled={isFetching}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
                periodo === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {ROTULO_PERIODO[p]}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {isFetching
            ? "Analisando as respostas…"
            : error
              ? "Não foi possível gerar a análise agora — exibindo um exemplo."
              : data
                ? `Análise gerada automaticamente em ${new Date(data.geradoEm).toLocaleString("pt-BR")}`
                : periodo !== "todos"
                  ? "Sem entrevistas suficientes no período selecionado — exibindo um exemplo."
                  : "Exibindo um exemplo."}
        </span>
      </div>

      {data && data.alertasUrgentes.length > 0 && (
        <div className="mb-4 rounded-xl border border-insuficiente/40 bg-insuficiente/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-insuficiente">
            <AlertOctagon className="size-4" />
            {data.alertasUrgentes.length === 1
              ? "1 caso precisa de atenção imediata do RH"
              : `${data.alertasUrgentes.length} casos precisam de atenção imediata do RH`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.alertasUrgentes.map((a) => (
              <li key={`${a.pessoa}-${a.resumo}`} className="text-sm leading-relaxed text-card-foreground">
                <span className="font-medium">{a.pessoa}:</span> {a.resumo}{" "}
                <span className="text-xs text-muted-foreground">({a.origem})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Respondentes", data?.respondentes ?? total],
          ["Sugestões acionáveis", leitura.comSugestaoAcionavel],
          ["Elogio no lugar de sugestão", leitura.elogioNoLugarDeSugestao],
          ["Sem sugestão", leitura.semSugestao],
        ].map(([label, valor]) => (
          <div key={String(label)} className="rounded-xl bg-secondary px-4 py-3">
            <p className="font-display text-2xl font-semibold text-secondary-foreground">{valor}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{leitura.observacao}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <ul className="space-y-2">
          {temas.map((t) => (

            <li key={t.id}>
              <button
                onClick={() => setAtivo(t.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-black transition-colors ${cor[t.sentimento]} ${
                  t.id === ativo
                    ? "border-black/60 ring-2 ring-black/30"
                    : "border-transparent hover:opacity-90"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-black">{t.titulo}</span>
                  <span className="block text-xs text-black/70">
                    {t.pessoas.length}{" "}
                    {t.pessoas.length === 1 ? "relato" : "relatos"} · {rotulo[t.sentimento]}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-border bg-muted/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {tema.lojas.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-card-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-card ${cor[tema.sentimento]}`}
            >
              {icone[tema.sentimento]}
              {rotulo[tema.sentimento]}
            </span>
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

      {data && (data.recomendacao.motivosPositivos.length > 0 || data.recomendacao.motivosNegativos.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-bom">
              <CheckCircle2 className="size-4" />
              Por que recomendariam / voltariam
            </p>
            <ul className="mt-2 space-y-1.5">
              {data.recomendacao.motivosPositivos.map((m) => (
                <li key={m} className="flex gap-2 text-sm leading-relaxed text-card-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-bom" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-insuficiente">
              <AlertTriangle className="size-4" />
              Por que não recomendariam / não voltariam
            </p>
            <ul className="mt-2 space-y-1.5">
              {data.recomendacao.motivosNegativos.map((m) => (
                <li key={m} className="flex gap-2 text-sm leading-relaxed text-card-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-insuficiente" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
