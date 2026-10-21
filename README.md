# DriverSize — site de divulgação

Landing page estática (HTML + CSS + JavaScript puro) para divulgar o DriverSize, com
capturas reais do aplicativo, carrossel de telas, FAQ, seção de download e versões em
**português, inglês, espanhol e francês**.

```
site/
├─ index.html               (português — fonte do conteúdo)
├─ build.mjs                (gera as outras três versões)
├─ i18n/
│  ├─ en.json
│  ├─ es.json
│  └─ fr.json               (traduções: chave = texto em português)
├─ en/index.html            (gerado — não edite à mão)
├─ es/index.html            (gerado)
├─ fr/index.html            (gerado)
├─ assets/
│  ├─ css/styles.css
│  ├─ js/main.js
│  └─ img/
│     ├─ logo.svg           (marca redonda)
│     ├─ favicon.svg
│     ├─ og-pt.jpg          (1200×630 — card social por idioma)
│     ├─ og-en.jpg
│     ├─ og-es.jpg
│     ├─ og-fr.jpg
│     └─ screens/           (capturas reais, WebP 1600px)
│        ├─ visao-geral.webp
│        ├─ arquivos-e-pastas.webp
│        ├─ visualizacao-em-grade.webp
│        ├─ tipos-de-arquivo.webp
│        ├─ limpeza-segura.webp
│        ├─ busca-global.webp
│        └─ tema-escuro.webp
├─ downloads/               (coloque aqui o instalador)
└─ README.md
```

---

## 1. Tecnologia recomendada (e por quê)

**Site estático: HTML + CSS + JS, sem framework.** É o que está implementado aqui.

| Opção | Quando faz sentido | Observação |
|---|---|---|
| **HTML/CSS/JS estático** ✅ | Uma página de divulgação, portfólio de produto, download | Zero dependências no navegador, nota máxima de performance, hospedagem gratuita, não "apodrece" |
| **Astro** | Várias páginas (blog, docs, changelog) mantendo HTML estático | Ótimo próximo passo se o site crescer; reaproveita este CSS |
| **Next.js / Nuxt** | Precisa de login, painel, API, personalização | Peso e complexidade desnecessários para uma landing page |
| **WordPress / Wix** | Quem não quer mexer em código | Mais lento, custo mensal, menos controle visual |

O ganho real de performance vem de **não** carregar framework: não há React, bundle nem
JavaScript de tradução no navegador. Cada página é HTML pronto (~26 KB), com CSS (~27 KB)
e um único JS (~10 KB). As 7 capturas somam ~577 KB.

O `build.mjs` roda **só na sua máquina**, para gerar as versões traduzidas. O que se
publica é HTML/CSS/JS puro — nenhum Node é necessário no servidor.

## 2. Rodar localmente

```powershell
cd site
python -m http.server 8123
# abra http://127.0.0.1:8123
```

Também funciona abrir `index.html` direto no navegador. Já as versões em subpastas
(`/en/`, `/es/`, `/fr/`) são mais fáceis de conferir com o servidor local.

## 3. Idiomas (PT · EN · ES · FR)

O português em `index.html` é a **fonte**. Inglês, espanhol e francês são gerados a
partir dele + os dicionários em `i18n/`.

```powershell
node build.mjs
```

Isso reescreve `en/index.html`, `es/index.html` e `fr/index.html` (e normaliza o próprio
`index.html`). Depois de editar qualquer texto:

1. edite o texto em português no `index.html`;
2. atualize a mesma chave nos arquivos `i18n/*.json`;
3. rode `node build.mjs`.

**Não edite `en/`, `es/` ou `fr/` à mão** — a próxima geração sobrescreve.

Como funciona:

- Cada chave do JSON é o **texto exato em português** (texto visível ou valor de `alt`,
  `aria-label`, `content`, `title`). Valores ausentes permanecem em português.
- O build troca o texto, ajusta `<html lang>`, `og:locale`, o JSON-LD e os caminhos
  (`assets/` → `../assets/`) das páginas em subpasta.
- O seletor **PT · EN · ES · FR** na barra superior (acima do menu) é gerado entre os marcadores
  `<!-- langswitch:start/end -->`; os links `hreflang` entre `<!-- alternates:... -->`.
  Os textos que o JS cria (bolinhas do carrossel, contador, botão do menu) viajam em
  atributos `data-*`, traduzidos como o resto.
- Para **adicionar um idioma**: copie `i18n/en.json`, traduza os valores, registre o
  idioma no array `LOCALES` do `build.mjs` e rode o build.

**Ao publicar com domínio**, gere os endereços absolutos (canonical, `hreflang`,
`og:url` e `og:image`):

```powershell
$env:SITE_URL="https://seudominio.com"; node build.mjs
```

Sem `SITE_URL`, o build usa `canonical` relativo e omite `hreflang`/`og:url` — evita
apontar para um domínio errado antes da hora.

## 4. Publicar (grátis)

- **Cloudflare Pages**: arraste a pasta `site` no painel → URL `*.pages.dev`, HTTPS e CDN prontos.
- **Netlify Drop**: https://app.netlify.com/drop → arraste a pasta.
- **GitHub Pages**: repositório `weguest/driversize-site`, branch `main`, pasta `/ (root)` →
  https://weguest.github.io/driversize-site/
- **Vercel**: `npx vercel` dentro da pasta.

Rode o build com `SITE_URL` **antes** de publicar para o card social e o `hreflang`
ficarem corretos.

## 5. As capturas de tela

Todas as telas do site são **capturas reais** do app (Electron + Angular, versão 1.2.1),
feitas a partir do próprio aplicativo em execução.

- Foram redimensionadas para **1600 px de largura** e convertidas para **WebP (qualidade 86)**,
  ficando entre 71 e 92 KB cada.
- O hero usa `visao-geral.webp`; o carrossel usa as outras 6.
- Cada slide tem um link **"Ver em tamanho real"** que abre o WebP em nova aba — útil em
  telas pequenas, onde a interface densa fica reduzida.

**Para trocar uma tela**: gere um WebP de 1600 px de largura com o mesmo nome em
`assets/img/screens/` e substitua o arquivo. Para adicionar uma tela nova, copie um
`<li class="slide">…</li>` no `index.html`, ajuste `src`, `alt`, título, texto e o link
`slide__zoom`; as bolinhas e o contador ("1 de 6") se ajustam sozinhos. Depois rode o
build e traduza o novo `alt`/título nos JSON.

## 6. O que editar antes de divulgar

1. **Download** — o botão aponta para a Release do repositório `weguest/driversize`:
   https://github.com/weguest/driversize/releases/download/v1.2.2/DriverSize-1.2.2-setup.exe
   A Release precisa ser publicada com esse nome de arquivo. O instalador nunca entra neste
   repositório.

   **Atualização automática:** o link é resolvido em duas camadas, sem edição manual:

   - `assets/js/main.js` consulta `releases/latest` na API do GitHub e reescreve o `href` do
     instalador (cache de 5 min em `sessionStorage`; se a API falhar, o link estático continua
     valendo).
   - `.github/workflows/sync-release.yml` roda de hora em hora, em cada push e sob demanda:
     executa `scripts/sync-release.mjs` (ajusta `index.html` + `README.md`), regera as páginas
     com `build.mjs` e commita apenas se algo mudou. Para conferir localmente:
     `node scripts/sync-release.mjs`.
2. **Café / doações** — troque os `href="#apoie"` (menu e banner) pelo seu link real
   (Buy Me a Coffee, Ko-fi, PIX etc.). O banner inteiro pode ser removido se não quiser doações.
3. **E-mail** — `mailto:contato@exemplo.com` no rodapé.
4. **Redes sociais** — os três ícones do rodapé apontam para âncoras internas; troque por
   GitHub, YouTube e e-mail reais.
5. **Textos** — edite o português em `index.html` e replique em `i18n/*.json`.
6. **Cores e tipografia** — tokens no topo de `assets/css/styles.css` (`--blue-600`, `--orange`,
   `--radius`, fonte Inter via Google Fonts).
7. **Domínio/SEO** — `<title>`, `meta description` e o JSON-LD no `<head>` do `index.html`;
   os equivalentes traduzidos vêm dos JSON. Rode com `SITE_URL` ao publicar.

## 7. O carrossel

`assets/js/main.js` implementa, sem biblioteca:

- setas, bolinhas, teclado (← →), arrastar/swipe;
- slide centralizado com "espiada" dos vizinhos;
- autoplay de 7 s que pausa no hover, no foco e com a aba oculta;
- contador acessível (`aria-live`) e `aria-current` nas bolinhas;
- arrastar não dispara o link "Ver em tamanho real" por acidente;
- respeito a `prefers-reduced-motion` (sem autoplay e sem animação);
- rótulos traduzidos lidos de `data-dot-label` / `data-status-format`.

## 8. Acessibilidade e performance

- Navegação por teclado, `skip link`, foco visível, `aria-*` nos controles.
- Layout responsivo (1440 → 390 px) sem rolagem horizontal, incluindo o seletor de idiomas.
- Cada página declara seu idioma (`<html lang>`) e os links de idioma têm `hreflang`,
  `lang` e `aria-current`.
- Zero requisições de JS de terceiros; fontes com `display=swap`.
- Imagens com `width`/`height` (sem "pulo" de layout) e `decoding="async"`.
- Sem JS, o conteúdo continua visível (a classe `.js` só é adicionada quando o JS roda).

## 9. Observação sobre marca

O site usa a marca **DriverSize** (nome, logo em SVG e textos). Antes de publicar, confirme
que você detém os direitos sobre o nome, o logo, as capturas de tela e o instalador
distribuído — e que a licença do aplicativo permite a redistribuição.
