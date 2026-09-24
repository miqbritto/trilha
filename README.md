# Trilha

## Desenvolvimento

Execute os comandos na raiz do projeto.

Instale as dependências do iniciador (uma vez):

```powershell
npm install
```

Se ainda não instalou as dependências das aplicações:

```powershell
npm --prefix frontend install
npm --prefix backend install
```

Inicie frontend e backend juntos:

```powershell
npm run dev
```

Para usar o backend com Neon e a configuração existente em
`backend/.env.neon.local`:

```powershell
npm run dev:neon
```

O frontend usa `npm start` e o backend usa `start:dev` (ou `start:dev:neon`),
com recarga durante o desenvolvimento. As configurações de ambiente continuam
sendo lidas pelo backend em sua própria pasta.

Os logs aparecem no mesmo terminal, identificados por aplicação. Pressione
`Ctrl+C` para encerrar os dois. Se um dos processos terminar, o outro também
será encerrado.

Para iniciar apenas uma aplicação, use `npm run dev:frontend`,
`npm run dev:backend` ou `npm run dev:backend:neon`.

## Configuração por ambiente

### Frontend: endereço da API

Os serviços de jogo e filmes usam `environment.apiUrl`:

- `frontend/src/environments/environment.development.ts`: desenvolvimento,
  com `http://localhost:3000`.
- `frontend/src/environments/environment.ts`: produção. **Substitua
  `https://api.example.com` pelo endereço HTTPS real do backend antes de publicar.**
  Esse endereço é apenas um exemplo; não existe uma API do jogo nele.

Informe a URL base, sem `/games` ou `/movies`. Os serviços acrescentam esses
caminhos. `npm run dev` e `npm --prefix frontend start` selecionam desenvolvimento.
O comando abaixo seleciona produção:

```powershell
npm --prefix frontend run build
```

O Angular seleciona o arquivo usando `fileReplacements` no `angular.json`.
Esses valores são públicos e entram no build: nunca coloque chaves ou senhas
nos arquivos de environment. Depois de alterar a URL de produção, gere e publique
um novo build; configurar uma variável no servidor não modifica o JavaScript
já gerado.

### Backend: origens permitidas no CORS

O backend lê `CORS_ORIGINS` pelo `ConfigService`. Localmente, você pode acrescentar
ao `backend/.env`:

```dotenv
NODE_ENV=development
CORS_ORIGINS=http://localhost:4200
```

Na hospedagem do backend, configure as variáveis de ambiente com o endereço
real do **frontend** (os domínios abaixo são exemplos):

```dotenv
NODE_ENV=production
CORS_ORIGINS=https://jogo.example.com,https://www.jogo.example.com
```

As origens devem incluir protocolo e, quando necessário, porta, sem caminhos
nem barra final. Cadastre apenas as origens utilizadas; a versão com `www` é
uma origem diferente. Reinicie o backend após alterar essas variáveis.

Sem `CORS_ORIGINS`, desenvolvimento permite `http://localhost:4200`; produção
não permite origens externas pelo CORS. CORS não substitui a autenticação das
rotas administrativas. As demais configurações do banco, TMDB e R2 permanecem
no ambiente do backend.
