export type Nota = "Excelente" | "Bom" | "Regular" | "Insuficiente";

export const CRITERIOS = [
  "Comunicação interna",
  "Estrutura física da empresa",
  "Recursos para o trabalho",
  "Escala / turno de trabalho",
  "Normas, regras e cultura",
  "Relacionamento com colegas",
  "Liderança direta",
  "Gestores",
  "Remuneração",
  "Benefícios oferecidos",
  "Classificação geral",
] as const;

export type Criterio = (typeof CRITERIOS)[number];

export type Entrevista = {
  /** carimbo_data_hora completo (timestamp), usado para localizar a linha no
   * Supabase ao excluir. Ausente nos dados de exemplo estáticos. */
  id?: string;
  data: string;
  nome: string;
  funcao: string;
  loja: string;
  admissao: string;
  demissao: string;
  iniciativa: "Colaborador" | "Empregador";
  motivo: string | null;
  novaColocacao: string | null;
  notas: Record<Criterio, Nota>;
  evitavel: string;
  sugestao: string;
  voltaria: string;
  indicaria: string;
};

const n = (v: Nota[]): Record<Criterio, Nota> =>
  Object.fromEntries(CRITERIOS.map((c, i) => [c, v[i]])) as Record<Criterio, Nota>;

export const ENTREVISTAS: Entrevista[] = [
  {
    data: "2026-01-23",
    nome: "Juliane dos Santos Coutinho",
    funcao: "Consultor de vendas direta",
    loja: "oBoticário",
    admissao: "24/10/2025",
    demissao: "12/12/2025",
    iniciativa: "Colaborador",
    motivo: "Insatisfação",
    novaColocacao: "Não",
    notas: n([
      "Bom",
      "Bom",
      "Bom",
      "Regular",
      "Regular",
      "Bom",
      "Bom",
      "Bom",
      "Insuficiente",
      "Regular",
      "Bom",
    ]),
    evitavel: "Não",
    sugestao: "Remuneração",
    voltaria: "Sim",
    indicaria: "Sim",
  },
  {
    data: "2026-01-23",
    nome: "Thaynara dos Santos Fontes",
    funcao: "Consultora de vendas",
    loja: "Melissa Partage",
    admissao: "25/08/2025",
    demissao: "23/12/2025",
    iniciativa: "Empregador",
    motivo: null,
    novaColocacao: null,
    notas: n([
      "Insuficiente",
      "Bom",
      "Regular",
      "Bom",
      "Bom",
      "Insuficiente",
      "Insuficiente",
      "Insuficiente",
      "Bom",
      "Bom",
      "Regular",
    ]),
    evitavel:
      "Agendei um horário com a supervisora e a mesma não se importou e deixou de lado. Eu precisava conversar sobre questões que não estavam legais na equipe e que estávamos sem comunicação dentro de loja. O gerente fica mais fora de loja do que dentro dela resolvendo os problemas. O estresse era grande por falta de comunicação entre a equipe e o gerente não dava uma boa solução.",
    sugestao:
      "Os superiores darem assistência melhor para as consultoras. Eles só querem que a gente suba para pegar os sapatos e eles demonstrarem; quando não conseguem converter, a consultora perde a venda.",
    voltaria: "Sim, mas não no shopping Partage com a equipe atual.",
    indicaria:
      "Não tive experiências legais na Melissa do Partage, então com a equipe de lá não indicaria. Queria muito ter conseguido trocar de loja depois do Natal.",
  },
  {
    data: "2026-01-23",
    nome: "Thayná Batista",
    funcao: "Vendedora",
    loja: "Franquia",
    admissao: "26/09/2025",
    demissao: "31/12/2025",
    iniciativa: "Empregador",
    motivo: null,
    novaColocacao: null,
    notas: n([
      "Bom",
      "Bom",
      "Bom",
      "Regular",
      "Bom",
      "Regular",
      "Bom",
      "Bom",
      "Bom",
      "Bom",
      "Bom",
    ]),
    evitavel:
      "Eu não consegui ir trabalhar em escala de shopping por ficar longe; se fosse em alguma loja com horário comercial eu ficaria.",
    sugestao: "Nunca tive problema com nada e nem ninguém, e pra mim tudo era ótimo.",
    voltaria: "Sim, vendedora ou no administrativo",
    indicaria: "Sim, uma empresa boa e que tem boa remuneração.",
  },
  {
    data: "2026-01-23",
    nome: "Mônica Isidório de Jesus",
    funcao: "Consultora de vendas",
    loja: "Quiosque",
    admissao: "10/09/2025",
    demissao: "12/01/2026",
    iniciativa: "Colaborador",
    motivo: "Relacionamento com equipe",
    novaColocacao: "Nenhum",
    notas: n([
      "Regular",
      "Regular",
      "Regular",
      "Regular",
      "Bom",
      "Regular",
      "Regular",
      "Regular",
      "Bom",
      "Bom",
      "Bom",
    ]),
    evitavel: "Prefiro não falar",
    sugestao: "Nenhum",
    voltaria: "Gostaria muito de trabalhar na VT ou na loja da Melissa",
    indicaria: "Sim",
  },
  {
    data: "2026-01-24",
    nome: "Joilson Viana Alves Júnior",
    funcao: "Repositor de mercadorias",
    loja: "Good Sales Perfumaria e Cosméticos",
    admissao: "09/10/2025",
    demissao: "06/01/2026",
    iniciativa: "Empregador",
    motivo: null,
    novaColocacao: null,
    notas: n([
      "Bom",
      "Bom",
      "Bom",
      "Bom",
      "Bom",
      "Regular",
      "Bom",
      "Bom",
      "Regular",
      "Regular",
      "Regular",
    ]),
    evitavel: "Não",
    sugestao: "Nada",
    voltaria: "Sim, com certeza, como repositor de mercadorias",
    indicaria: "Sim, ótima empresa",
  },
  {
    data: "2026-01-26",
    nome: "Karina Pereira",
    funcao: "Consultora de vendas",
    loja: "Vip's",
    admissao: "01/12/2025",
    demissao: "01/2026",
    iniciativa: "Empregador",
    motivo: null,
    novaColocacao: null,
    notas: n([
      "Regular",
      "Excelente",
      "Regular",
      "Regular",
      "Regular",
      "Insuficiente",
      "Insuficiente",
      "Bom",
      "Regular",
      "Bom",
      "Bom",
    ]),
    evitavel:
      "Tinha muito o que mostrar e se viu obrigada a concordar com situações que não achou justas (passar venda). A equipe é pequena e tem tudo pra ser unida, mas quando ela passou a vender houve resistência. Pediu para ensinarem os indicadores e teve resistência. Não teve um bom treinamento.",
    sugestao:
      "Organização de reuniões semanais. Pontuar as coisas, não apenas colocar no quadro. Motivar mais. Relacionamento com a equipe: não só passar os números, mostrar para o que eles servem.",
    voltaria: "Com certeza, mesma área - vendas.",
    indicaria: "Sim, achou uma empresa leve e boa de trabalhar.",
  },
  {
    data: "2026-01-26",
    nome: "Jaira Moço da Silva",
    funcao: "Consultora de vendas",
    loja: "Assaí",
    admissao: "27/10/2025",
    demissao: "09/01/2026",
    iniciativa: "Colaborador",
    motivo: "Proposta melhor",
    novaColocacao: "Varejo",
    notas: n([
      "Bom",
      "Insuficiente",
      "Bom",
      "Insuficiente",
      "Bom",
      "Bom",
      "Bom",
      "Bom",
      "Regular",
      "Regular",
      "Bom",
    ]),
    evitavel:
      "Acredito que com o horário, por ser horário de shopping, fora do comercial. As ruas ficam mais vazias e perigosas, isso influenciou bastante a minha saída.",
    sugestao:
      "Uma empresa muito boa para se trabalhar, a mais organizada e empática em que já trabalhei.",
    voltaria:
      "Com certeza voltaria, fui muito feliz em todos os aspectos; adoraria voltar como consultora em loja com horário comercial.",
    indicaria:
      "Indicaria tanto para trabalhar como para comprar, a empresa é muito cuidadosa com os funcionários.",
  },
];

export const PESO: Record<Nota, number> = {
  Excelente: 4,
  Bom: 3,
  Regular: 2,
  Insuficiente: 1,
};
