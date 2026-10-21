# Contribuindo com o site

## Modelo de branches

O site usa **trunk-based development / GitHub Flow**. Não existem branches permanentes
`dev` ou `hml`.

```text
main (protegida, publicada no GitHub Pages)
├─ feat/...
├─ fix/...
├─ chore/...
└─ docs/...
```

- `main` é a única branch permanente.
- Branches de trabalho são curtas e nascem da `main`.
- Toda merge na `main` publica em `https://weguest.github.io/driversize-site/`.
- Não há release por tag para o site; o deploy é contínuo a partir da `main`.

## Fluxo

1. Atualize a `main`:

```powershell
git switch main
git pull
```

2. Crie a branch:

```powershell
git switch -c feat/nome-curto
```

3. Edite o português em `index.html` e as traduções em `i18n/*.json`.
4. Gere as páginas:

```powershell
$env:SITE_URL="https://weguest.github.io/driversize-site"; node build.mjs
```

5. Abra um PR para `main`.
6. O workflow **CI** valida o build e verifica se as páginas geradas estão atualizadas.
7. Faça **squash merge** e apague a branch.
8. O GitHub Pages publica a nova versão.

## Regras

- Não edite `en/`, `es/` ou `fr/` à mão; eles são gerados pelo `build.mjs`.
- O botão de download aponta para a Release do repositório `weguest/driversize`.
- O instalador nunca deve ser commitado neste repositório.
- Mantenha `SITE_URL` igual ao domínio publicado.
- Quando o domínio próprio estiver ativo, troque `SITE_URL` para
  `https://driversize.com` e rode o build novamente.
