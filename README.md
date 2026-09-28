# Painel de Entrevistas de Desligamento — Grupo RDZ

Dashboard com os indicadores de RH obtidos nas entrevistas de desligamento.

## Desenvolvimento

Requer Node.js 22+.

```sh
npm install
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz (não é versionado):

| Variável | Uso |
| --- | --- |
| `EXT_SUPABASE_URL` | URL do projeto Supabase com a tabela `Entrevistadesligamento` |
| `EXT_SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço desse projeto (somente servidor) |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic, usada na análise por IA (opcional) |
| `ANTHROPIC_MODEL` | Modelo da análise (opcional, padrão `claude-sonnet-5`) |

## Build

```sh
npm run build
```

O build usa Nitro; sem `NITRO_PRESET`, gera um servidor Node em `.output/`.
