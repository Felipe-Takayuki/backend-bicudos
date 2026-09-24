# 🌾 API de Monitoramento de Pragas 

API RESTful de alta performance e segurança desenvolvida em **Node.js** com **TypeScript** e **PostgreSQL com extensão PostGIS**, projetada especificamente para suportar o ecossistema do aplicativo de **Monitoramento de Pragas com Integração QGIS**.

---

## 🎯 Escolha do Banco de Dados: Por que PostgreSQL com PostGIS?

Para este projeto agronômico e de Sistemas de Informação Geográfica (SIG), o **PostgreSQL com a extensão PostGIS** é indiscutivelmente o banco de dados mais adequado do mercado pelos seguintes motivos:

1. **Suporte Nativo a Dados Geoespaciais (OGC Compliant)**:
   - Armazena e processa pontos, polígonos de talhões e coordenadas espaciais com precisão geodésica (WGS 84 / EPSG:4326).
   - Suporte a altitude, precisão de GPS e cálculos de distância na curvatura da Terra com funções espaciais como `ST_DWithin`, `ST_DistanceSphere` e `ST_MakePoint`.
2. **Integração Direta e Nativa com o QGIS**:
   - O **QGIS** possui um conector de dados nativo de alta velocidade para o PostgreSQL/PostGIS. Engenheiros agrônomos e analistas de SIG podem conectar o QGIS diretamente ao banco de dados para renderizar mapas de calor (heatmaps), zonas de infestação e curvas de nível sem necessidade de intermediários.
3. **Indexação Espacial R-Tree / GiST**:
   - Consultas de proximidade (ex: "quais pragas foram detectadas a um raio de 5 km deste talhão?") executam em milissegundos mesmo com milhões de registros.
4. **Confiabilidade ACID Corporativa**:
   - Garante consistência transacional para sincronizações em lote provenientes do app em modo offline.

---

## 🛡️ Boas Práticas de Programação e Segurança Implementadas

A API foi desenvolvida seguindo rigorosos padrões de engenharia de software e segurança:

| Camada | Implementação & Boas Práticas |
|---|---|
| **Arquitetura** | **Clean Layered Architecture & SOLID**: Separação clara entre Controllers, Services (regras de negócio puras), Repositories (Prisma ORM) e DTOs/Schemas. |
| **Tipagem Estrita** | **TypeScript Strict Mode** (`"strict": true`) em 100% do código, eliminando erros em tempo de execução. |
| **Autenticação Segura** | **JWT (JSON Web Tokens)** assinado com chave criptográfica robusta, acompanhado de **Refresh Tokens** persistidos e revogáveis. |
| **Criptografia de Senhas** | **Bcrypt** com fator de custo (*salt rounds*) 12 e validação rigorosa de complexidade (mínimo 8 caracteres, maiúsculas, minúsculas e números). |
| **Controle de Acesso (RBAC)** | Perfis de usuário com permissões granulares: `ADMIN`, `AGRONOMIST` (Agrônomo) e `OPERATOR` (Técnico de Campo). |
| **Proteção contra Brute Force & DoS** | **Rate Limiting** com `express-rate-limit`: limite estrito em rotas de login/registro (10 tentativas / 15 min) e limite global para tráfego da API. |
| **Headers HTTP Seguros** | **Helmet** habilitado configurando `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `Strict-Transport-Security (HSTS)` e `Content-Security-Policy`. |
| **Validação e Sanitização** | **Zod** em todas as requisições (`body`, `query`, `params`), rejeitando propriedades desconhecidas e validando limites físicos de coordenadas (Latitude: -90 a 90; Longitude: -180 a 180). |
| **Tratamento Centralizado de Erros** | Respostas de erro padronizadas, sem vazamento de stack traces em produção. |
| **Resiliência do Processo** | **Graceful Shutdown** tratando sinais `SIGTERM` e `SIGINT` para fechar conexões ativas do banco e do servidor HTTP sem perda de dados. |
| **Sincronização Offline-First** | Rota em lote `POST /api/v1/pest-records/sync` compatível com o banco SQLite local do app Flutter. |

---

## 📁 Estrutura de Diretórios

```
backend/
├── docker/
│   └── init-postgis.sql         # Script SQL de ativação das extensões PostGIS
├── prisma/
│   ├── schema.prisma            # Modelagem de dados com índices espaciais
│   └── seed.ts                  # Carga inicial com usuários e registros agrícolas reais
├── src/
│   ├── @types/
│   │   └── express.d.ts         # Extensão dos tipos do Express (req.user)
│   ├── config/
│   │   ├── env.ts               # Validação de variáveis de ambiente com Zod (Fail-Fast)
│   │   └── prisma.ts            # Instância singleton do Prisma Client
│   ├── core/
│   │   ├── errors/
│   │   │   └── app-error.ts     # Hierarquia de classes semânticas de erro
│   │   └── middlewares/
│   │       ├── auth.middleware.ts       # Validação JWT e RBAC
│   │       ├── error.middleware.ts      # Handler global de erros
│   │       ├── rate-limiter.middleware.ts # Proteção contra DoS e força bruta
│   │       └── validation.middleware.ts # Validação genérica com Zod
│   ├── modules/
│   │   ├── auth/                # Módulo de Autenticação (Register, Login, Me, Password)
│   │   ├── pest-records/        # Módulo de Pragas (CRUD, Geo-queries, Sync, QGIS)
│   │   ├── statistics/          # Módulo de Estatísticas Agronômicas
│   │   └── docs/
│   │       └── swagger.json     # Especificação OpenAPI 3.0 completa
│   ├── utils/
│   │   ├── geojson.ts           # Formatador GeoJSON RFC 7946
│   │   └── csv.ts               # Exportador CSV com geometria WKT POINT
│   ├── app.ts                   # Configuração dos middlewares e rotas Express
│   └── server.ts                # Inicialização do servidor e Graceful Shutdown
├── tests/                       # Suíte de testes automatizados (Vitest + Supertest)
├── docker-compose.yml           # Ambiente pronto com PostgreSQL 16 + PostGIS
├── Dockerfile                   # Build multi-stage para produção
├── package.json
└── tsconfig.json
```

---

## 🚀 Como Executar

### 1. Pré-requisitos
- **Node.js** 20+ ou 22+
- **Docker** e **Docker Compose** (recomendado para o PostgreSQL com PostGIS)

### 2. Configurar o Ambiente
Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

### 3. Iniciar o Banco de Dados com Docker
Suba o banco de dados PostgreSQL com PostGIS em segundo plano:
```bash
docker compose up postgres -d
```

### 4. Executar as Migrações e Seeds
```bash
npm run prisma:push
npm run prisma:seed
```

### 5. Iniciar o Servidor em Modo Desenvolvimento
```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

---

## 📖 Documentação Interativa da API (Swagger UI)

Com o servidor rodando, acesse a documentação interativa completa com testes de requisição no navegador:

- **Produção:** 👉 **[https://bicudos.fdevs.io/docs](https://bicudos.fdevs.io/docs)**
- **Local:** 👉 **[http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs)**

---

## 📡 Principais Rotas da API

### 🔐 Autenticação (`/api/v1/auth`)
| Método | Endpoint | Protegido | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Não (Rate Limit) | Cadastro de novos agrônomos/operadores |
| `POST` | `/api/v1/auth/login` | Não (Rate Limit) | Autenticação com e-mail e senha -> retorna JWT e Refresh Token |
| `POST` | `/api/v1/auth/refresh-token` | Não | Renovação do access token JWT |
| `POST` | `/api/v1/auth/logout` | Não | Invalidação do refresh token |
| `GET` | `/api/v1/auth/me` | Sim (Bearer) | Obtém os dados do usuário autenticado |
| `PUT` | `/api/v1/auth/change-password` | Sim (Bearer) | Alteração de senha com invalidação de sessões |

### 🌾 Monitoramento de Pragas (`/api/v1/pest-records`)
| Método | Endpoint | Protegido | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/pest-records` | Opcional | Listagem paginada com filtros por praga, talhão, cultura e data |
| `POST` | `/api/v1/pest-records` | Sim (Bearer) | Criação de novo ponto georreferenciado |
| `GET` | `/api/v1/pest-records/:id` | Opcional | Busca registro por UUID |
| `PUT` | `/api/v1/pest-records/:id` | Sim (Bearer) | Atualização de registro |
| `DELETE` | `/api/v1/pest-records/:id` | Sim (Bearer) | Remoção de registro |
| `POST` | `/api/v1/pest-records/sync` | Sim (Bearer) | **Sincronização em lote Offline-First** do app móvel |
| `GET` | `/api/v1/pest-records/nearby` | Opcional | **Busca geoespacial por raio** (distância em metros) |
| `GET` | `/api/v1/pest-records/export/geojson` | Público | **Download de GeoJSON RFC 7946** para arrastar para o QGIS |
| `GET` | `/api/v1/pest-records/export/csv` | Público | **Download de CSV com WKT POINT** para QGIS e planilhas |

### 📊 Estatísticas Agronômicas (`/api/v1/statistics`)
| Método | Endpoint | Protegido | Descrição |
|---|---|---|---|
| `GET` | `/api/v1/statistics/overview` | Opcional | Resumo agronômico: total de insetos, média por ponto, praga predominante e ponto crítico |

---

## 🧪 Testes Automatizados

A API conta com testes automatizados cobrindo regras de negócio, segurança criptográfica, utilitários QGIS e endpoints HTTP:

```bash
npm test
```

Para rodar os testes em modo watch:
```bash
npx vitest
```

---

