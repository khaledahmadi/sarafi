import { FONT_STYLESHEET_URL } from "@/lib/fonts";
import { readLocaleCookie } from "@/i18n/cookie";
import { localeDir } from "@/i18n/config";
import { translate } from "@/i18n/translate";

export function renderErrorPage(cookieHeader?: string | null): string {
  const locale = readLocaleCookie(cookieHeader);
  const dir = localeDir(locale);
  const title = translate(locale, "errors.pageFailedTitle");
  const body = translate(locale, "errors.serverFailedBody");
  const retry = translate(locale, "common.retry");
  const home = translate(locale, "common.backHome");

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${FONT_STYLESHEET_URL}" />
    <style>
      body {
        font-family: "Vazirmatn", ui-sans-serif, system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.5;
        background: #fafafa;
        color: #111;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
        -webkit-font-smoothing: antialiased;
      }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 700; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font: inherit;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
      }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${body}</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">${retry}</button>
        <a class="secondary" href="/">${home}</a>
      </div>
    </div>
  </body>
</html>`;
}
