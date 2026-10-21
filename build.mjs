/* ==========================================================================
   DriverSize — gerador das versões em português, inglês, espanhol e francês.

   Uso:
     node build.mjs
     SITE_URL=https://seudominio.com node build.mjs   (recomendado ao publicar)

   Entrada:  index.html (português) + i18n/*.json
   Saída:    index.html, en/index.html, es/index.html, fr/index.html

   As páginas geradas são estáticas: nenhum JavaScript de tradução é
   necessário no navegador. Os textos do carrossel e do menu móvel viajam em
   atributos data-*, que o main.js lê.
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');

const LOCALES = [
  {
    code: 'pt',
    htmlLang: 'pt-BR',
    ogLocale: 'pt_BR',
    dir: '',
    short: 'PT',
    label: 'Português',
    langLabel: 'Idioma',
    jsonLdDescription:
      'Analisador de espaço em disco que mostra o tamanho de cada pasta e arquivo, com gráficos e relatórios.'
  },
  {
    code: 'en',
    htmlLang: 'en',
    ogLocale: 'en_US',
    dir: 'en',
    short: 'EN',
    label: 'English',
    langLabel: 'Language',
    jsonLdDescription:
      'Disk space analyzer that shows the size of every folder and file, with charts and reports.'
  },
  {
    code: 'es',
    htmlLang: 'es',
    ogLocale: 'es_ES',
    dir: 'es',
    short: 'ES',
    label: 'Español',
    langLabel: 'Idioma',
    jsonLdDescription:
      'Analizador de espacio en disco que muestra el tamaño de cada carpeta y archivo, con gráficos e informes.'
  },
  {
    code: 'fr',
    htmlLang: 'fr',
    ogLocale: 'fr_FR',
    dir: 'fr',
    short: 'FR',
    label: 'Français',
    langLabel: 'Langue',
    jsonLdDescription:
      "Analyseur d'espace disque qui affiche la taille de chaque dossier et fichier, avec graphiques et rapports."
  }
];

/* Textos que não devem ser traduzidos (marca, números, símbolos, código). */
const KEEP = new Set([
  'Driver', 'Size', 'System Volume Information', '₿', '❤️', '©', '2026',
  '460 GB', 'Windows 10 / 11 · 64 bits', '1', '2', '3', '4', 'GitHub',
  'Português', 'English', 'Español', 'Français', 'PT', 'EN', 'ES', 'FR',
  'Idioma', 'Language', 'Langue'
]);

const ATTRS = [
  'alt', 'aria-label', 'aria-roledescription', 'content', 'title', 'placeholder',
  'data-label-open', 'data-label-close', 'data-dot-label', 'data-status-format'
];

const ATTR_RE = new RegExp('\\s(' + ATTRS.join('|') + ')="([^"]*)"', 'g');
const TOKEN_RE = /<[^>]+>|[^<]+/g;

function readDict(code) {
  if (code === 'pt') return {};
  return JSON.parse(readFileSync(join(ROOT, 'i18n', code + '.json'), 'utf8'));
}

function translateHtml(html, dict) {
  let inRaw = false;

  return html.replace(TOKEN_RE, (token) => {
    if (token.startsWith('<')) {
      const name = (token.match(/^<\/?\s*([a-zA-Z0-9-]+)/) || [])[1];
      const lower = name ? name.toLowerCase() : '';
      if (lower === 'script' || lower === 'style') inRaw = !/^<\//.test(token);

      return token.replace(ATTR_RE, (full, attr, value) => {
        const key = value.trim();
        const translated = dict[attr + ' :: ' + key] ?? dict[key];
        return translated === undefined ? full : full.replace('"' + value + '"', '"' + translated + '"');
      });
    }

    if (inRaw) return token;

    const parts = token.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const core = parts[2].replace(/\s+/g, ' ');
    if (!core) return token;

    const translated = dict['text :: ' + core] ?? dict[core];
    return translated === undefined ? token : parts[1] + translated + parts[3];
  });
}

function pageUrl(locale) {
  if (!SITE_URL) return './';
  return SITE_URL + '/' + (locale.dir ? locale.dir + '/' : '');
}

function alternates(locale) {
  const lines = ['<link rel="canonical" href="' + pageUrl(locale) + '">'];

  if (SITE_URL) {
    for (const item of LOCALES) {
      lines.push('<link rel="alternate" hreflang="' + item.htmlLang + '" href="' + pageUrl(item) + '">');
    }
    lines.push('<link rel="alternate" hreflang="x-default" href="' + pageUrl(LOCALES[0]) + '">');
  }

  return lines.join('\n');
}

function langHref(current, target) {
  if (current.code === target.code) return './';
  if (current.code === 'pt') return target.dir + '/';
  if (target.code === 'pt') return '../';
  return '../' + target.dir + '/';
}

function langSwitch(current) {
  const links = LOCALES.map((locale) => {
    const currentAttr = locale.code === current.code ? ' aria-current="true"' : '';
    return (
      '        <a href="' + langHref(current, locale) + '" hreflang="' + locale.htmlLang +
      '" lang="' + locale.htmlLang + '"' + currentAttr + ' aria-label="' + locale.label + '">' +
      locale.short + '</a>'
    );
  }).join('\n');

  return '      <nav class="lang" aria-label="' + current.langLabel + '">\n' + links + '\n      </nav>';
}

function build() {
  const source = readFileSync(join(ROOT, 'index.html'), 'utf8');

  for (const locale of LOCALES) {
    const dict = readDict(locale.code);
    let html = translateHtml(source, dict);

    html = html.replace(/<html lang="[^"]*">/, '<html lang="' + locale.htmlLang + '">');

    const metaBlock = [
      '<meta property="og:locale" content="' + locale.ogLocale + '">'
    ];
    if (SITE_URL) {
      metaBlock.push('<meta property="og:url" content="' + pageUrl(locale) + '">');
    }
    html = html.replace(
      /(<!-- meta:start -->)[\s\S]*?(<!-- meta:end -->)/,
      (_, start, end) => start + '\n' + metaBlock.join('\n') + '\n' + end
    );

    html = html.replace(
      /(<!-- alternates:start -->)[\s\S]*?(<!-- alternates:end -->)/,
      (_, start, end) => start + '\n' + alternates(locale) + '\n' + end
    );

    html = html.replace(
      /(<!-- langswitch:start -->)[\s\S]*?(<!-- langswitch:end -->)/,
      (_, start, end) => start + '\n' + langSwitch(locale) + '\n    ' + end
    );

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DriverSize',
      operatingSystem: 'Windows 11, Windows 10',
      applicationCategory: 'UtilitiesApplication',
      description: locale.jsonLdDescription,
      inLanguage: locale.htmlLang,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' }
    };
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      '<script type="application/ld+json">\n' + JSON.stringify(jsonLd, null, 2) + '\n</script>'
    );

    if (locale.dir) {
      html = html
        .replace(/(\s(?:href|src)=")assets\//g, '$1../assets/')
        .replace(/(\shref=")downloads\//g, '$1../downloads/')
        .replace(/(\scontent=")assets\//g, '$1../assets/');
    }

    const ogImage = SITE_URL
      ? SITE_URL + '/assets/img/og-' + locale.code + '.jpg'
      : (locale.dir ? '../' : '') + 'assets/img/og-' + locale.code + '.jpg';
    html = html.replace(
      /(<meta property="og:image" content=")[^"]*(")/,
      (_, start, end) => start + ogImage + end
    );

    const outDir = locale.dir ? join(ROOT, locale.dir) : ROOT;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf8');

    console.log('✓ ' + (locale.dir ? locale.dir + '/' : '') + 'index.html  (' + locale.htmlLang + ')');
  }

  if (!SITE_URL) {
    console.log('\n• hreflang e og:url ficaram de fora: rode com SITE_URL=https://seudominio.com para gerá-los.');
  }
}

build();
