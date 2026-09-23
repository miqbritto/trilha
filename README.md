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
