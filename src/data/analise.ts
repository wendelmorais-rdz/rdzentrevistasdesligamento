export type Sentimento = "critico" | "atencao" | "positivo";

export type Tema = {
  id: string;
  titulo: string;
  resumo: string;
  sentimento: Sentimento;
  pessoas: string[];
  lojas: string[];
  criteriosLigados: string[];
  citacoes: { autor: string; texto: string; origem: string }[];
  acoes: string[];
};

/**
 * Análise temática das respostas abertas, com foco na pergunta
 * "O que você deixaria como sugestão para o processo de melhoria da empresa?",
 * cruzada com "Sua saída poderia ter sido evitada?" e as notas por critério.
 */
export const TEMAS: Tema[] = [
  {
    id: "lideranca",
    titulo: "Liderança e presença dos gestores na loja",
    resumo:
      "Três relatos apontam liderança ausente, sem pulso firme ou sem escuta. Pedidos de conversa foram ignorados e conflitos de equipe não tiveram solução. É o tema com maior peso nas saídas evitáveis.",
    sentimento: "critico",
    pessoas: ["Thaynara dos Santos Fontes", "Karina Pereira", "Mônica Isidório de Jesus"],
    lojas: ["Melissa Partage", "Vip's", "Quiosque"],
    criteriosLigados: ["Liderança direta", "Gestores", "Relacionamento com colegas"],
    citacoes: [
      {
        autor: "Thaynara dos Santos Fontes",
        origem: "Sugestão de melhoria",
        texto:
          "Os superiores darem assistência melhor para as consultoras. Eles só querem que a gente suba para pegar os sapatos e eles demonstrarem; quando não conseguem converter, a consultora perde a venda.",
      },
      {
        autor: "Thaynara dos Santos Fontes",
        origem: "Saída evitável",
        texto:
          "Agendei um horário com a supervisora e a mesma não se importou e deixou de lado. O gerente fica mais fora de loja do que dentro dela resolvendo os problemas.",
      },
      {
        autor: "Karina Pereira",
        origem: "Saída evitável",
        texto: "Gerente difícil na resolução dos problemas, sem pulso firme nas horas que deveria.",
      },
    ],
    acoes: [
      "Definir tempo mínimo de permanência do gerente em loja e registrar rotina de acompanhamento.",
      "Criar canal com prazo de resposta para pedidos de conversa com supervisão (ex.: 48h).",
      "Treinar líderes em mediação de conflitos e feedback, com avaliação pela equipe.",
    ],
  },
  {
    id: "reunioes",
    titulo: "Reuniões, metas e comunicação interna",
    resumo:
      "Pedido explícito de reuniões semanais e de explicar os indicadores, não apenas expor números no quadro. A comunicação interna é o critério com pior média entre quem saiu.",
    sentimento: "critico",
    pessoas: ["Karina Pereira", "Thaynara dos Santos Fontes"],
    lojas: ["Vip's", "Melissa Partage"],
    criteriosLigados: ["Comunicação interna", "Gestores"],
    citacoes: [
      {
        autor: "Karina Pereira",
        origem: "Sugestão de melhoria",
        texto:
          "Organização de reuniões semanais. Pontuar as coisas, não apenas colocar no quadro. Motivar mais. Relacionamento com a equipe: não só passar os números, mostrar para o que eles servem.",
      },
      {
        autor: "Thaynara dos Santos Fontes",
        origem: "Saída evitável",
        texto:
          "Precisava conversar sobre questões que não estavam legais na equipe e que estávamos sem comunicação dentro de loja. No final todas ficavam quietas.",
      },
    ],
    acoes: [
      "Padronizar reunião semanal de 20 minutos por loja com pauta fixa: resultado, prioridade da semana, escuta.",
      "Explicar cada indicador e o que a consultora pode fazer para movê-lo.",
    ],
  },
  {
    id: "vendas",
    titulo: "Divisão de vendas e justiça no reconhecimento",
    resumo:
      "Relato de venda registrada no nome de outra pessoa e pressão para transferir vendas a colegas. Afeta diretamente confiança, clima e remuneração variável.",
    sentimento: "critico",
    pessoas: ["Karina Pereira"],
    lojas: ["Vip's"],
    criteriosLigados: ["Relacionamento com colegas", "Remuneração", "Normas, regras e cultura"],
    citacoes: [
      {
        autor: "Karina Pereira",
        origem: "Saída evitável",
        texto:
          "Se viu obrigada a concordar com situações que não achou justas (passar venda). Pediram para começar a passar as vendas dela para outra consultora, para ajudar a bater as metas dela.",
      },
    ],
    acoes: [
      "Escrever e divulgar a regra de atribuição de venda (ordem da vez, intervalos, atendimento compartilhado).",
      "Auditar mensalmente vendas registradas fora do horário de trabalho da consultora.",
    ],
  },
  {
    id: "treinamento",
    titulo: "Treinamento e integração de novos consultores",
    resumo:
      "Entrada sem treinamento estruturado em período de alto fluxo, com resistência da equipe em ensinar indicadores. Impacta desempenho nos primeiros 90 dias — janela em que ocorreram todas as saídas.",
    sentimento: "atencao",
    pessoas: ["Karina Pereira"],
    lojas: ["Vip's"],
    criteriosLigados: ["Recursos para o trabalho", "Normas, regras e cultura"],
    citacoes: [
      {
        autor: "Karina Pereira",
        origem: "Saída evitável",
        texto:
          "Pediu para ensinarem os indicadores e tiveram resistência. O desempenho dela poderia ter sido bem melhor, mas não teve um bom treinamento.",
      },
    ],
    acoes: [
      "Checklist de integração de 30 dias com padrinho designado por loja.",
      "Bloquear admissões em pico sem responsável formal pelo treinamento.",
    ],
  },
  {
    id: "escala",
    titulo: "Escala de shopping, deslocamento e segurança",
    resumo:
      "Duas saídas foram atribuídas ao horário de shopping: distância e insegurança no retorno para casa. Ambas afirmam que ficariam em loja com horário comercial.",
    sentimento: "atencao",
    pessoas: ["Jaira Moço da Silva", "Thayná Batista"],
    lojas: ["Assaí", "Franquia"],
    criteriosLigados: ["Escala / turno de trabalho", "Estrutura física da empresa"],
    citacoes: [
      {
        autor: "Jaira Moço da Silva",
        origem: "Saída evitável",
        texto:
          "Por ser horário de shopping, fora do comercial, as ruas ficam mais vazias e perigosas; isso influenciou bastante a minha saída.",
      },
      {
        autor: "Thayná Batista",
        origem: "Saída evitável",
        texto:
          "Não consegui trabalhar em escala de shopping por ficar longe; se fosse em loja com horário comercial eu ficaria.",
      },
    ],
    acoes: [
      "Perguntar sobre deslocamento e turno na seleção e alocar por proximidade.",
      "Avaliar apoio no fechamento (saída em dupla ou auxílio transporte noturno).",
      "Oferecer transferência interna antes de aceitar o pedido de demissão.",
    ],
  },
  {
    id: "remuneracao",
    titulo: "Remuneração e benefícios",
    resumo:
      "Uma sugestão trata apenas de remuneração e outra classifica benefícios como regulares. Não é o motivo dominante, mas aparece como fator de insatisfação em lojas de menor fluxo.",
    sentimento: "atencao",
    pessoas: ["Juliane dos Santos Coutinho", "Joilson Viana Alves Júnior"],
    lojas: ["oBoticário", "Good Sales Perfumaria e Cosméticos"],
    criteriosLigados: ["Remuneração", "Benefícios oferecidos"],
    citacoes: [
      {
        autor: "Juliane dos Santos Coutinho",
        origem: "Sugestão de melhoria",
        texto: "Remuneração.",
      },
    ],
    acoes: [
      "Comparar fixo + variável praticado por loja com o mercado local.",
      "Simular ganho realista de variável já na contratação.",
    ],
  },
  {
    id: "positivos",
    titulo: "Pontos a preservar",
    resumo:
      "Três respostas usam a pergunta de sugestão para elogiar a empresa: organização, empatia e boa remuneração. Seis das sete pessoas voltariam a trabalhar no grupo.",
    sentimento: "positivo",
    pessoas: ["Jaira Moço da Silva", "Thayná Batista", "Joilson Viana Alves Júnior"],
    lojas: ["Assaí", "Franquia", "Good Sales Perfumaria e Cosméticos"],
    criteriosLigados: ["Classificação geral", "Normas, regras e cultura"],
    citacoes: [
      {
        autor: "Jaira Moço da Silva",
        origem: "Sugestão de melhoria",
        texto:
          "Uma empresa muito boa para se trabalhar, a mais organizada e empática em que já trabalhei.",
      },
      {
        autor: "Thayná Batista",
        origem: "Sugestão de melhoria",
        texto: "Nunca tive problema com nada e nem ninguém, e pra mim tudo era ótimo.",
      },
    ],
    acoes: [
      "Usar os depoimentos positivos em employer branding e recontratação (6 de 7 voltariam).",
      "Mapear as práticas dessas lojas e replicar nas unidades críticas.",
    ],
  },
];

export const LEITURA_SUGESTOES = {
  respondentes: 7,
  comSugestaoAcionavel: 3,
  elogioNoLugarDeSugestao: 3,
  semSugestao: 1,
  observacao:
    "Apenas 3 das 7 pessoas deixaram uma sugestão acionável; 3 usaram o campo para elogiar e 1 respondeu \"nenhum\". As críticas mais duras aparecem na pergunta sobre saída evitável, não no campo de sugestão — por isso as duas perguntas foram analisadas em conjunto.",
};
