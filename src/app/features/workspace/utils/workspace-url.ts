/**
 * Utilitários compartilhados para identificar aplicações e montar URLs de
 * telas. Usados pelo menu lateral e pela Home.
 */

/**
 * Gera o identificador técnico da aplicação a partir do nome do projeto.
 *
 * Exemplo: "Portal Wr" -> "portal-wr"
 */
export function buildSystemId(project: string): string {
  return project
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-');
}

/** Parâmetro que avisa o sistema embutido que ele está no Workspace. */
export const PARAMETRO_WORKSPACE = 'workspace';

/**
 * Acrescenta `?workspace=1` na URL (antes do `#`).
 *
 * Os sistemas (via dtp-angular-library) só entram no "modo Workspace"
 * (sem header e sem menu lateral) quando estão em um iframe E têm o
 * marcador: o nome do iframe (`name="dtp-workspace"`, no IframeHost) ou
 * este parâmetro. O nome é o principal, porque sobrevive a redirecionamentos
 * do sistema; o parâmetro fica como reforço. Quem abre o sistema direto
 * continua vendo o layout normal.
 *
 * Exemplo: "http://host:8588/#/cotacoes" -> "http://host:8588/?workspace=1#/cotacoes"
 */
export function marcarUrlWorkspace(url: string): string {
  try {
    const destino = new URL(url, window.location.href);
    destino.searchParams.set(PARAMETRO_WORKSPACE, '1');
    return destino.toString();
  } catch {
    return url;
  }
}

/** Origem (RODFRM.NOMEXE) das telas que abrem na `urlPortal` da aplicação. */
const ORIGEM_PORTAL = 'portal wr';

/**
 * URL base de uma tela da aplicação: a do Portal WR para telas com origem
 * "Portal Wr" (quando a aplicação tem `portalUrl`), senão a `baseUrl`.
 */
export function baseUrlDaTela(
  application: { baseUrl: string; portalUrl?: string },
  origem?: string | null
): string {
  const ehPortal = origem?.trim().toLowerCase() === ORIGEM_PORTAL;
  return ehPortal && application.portalUrl ? application.portalUrl : application.baseUrl;
}

/** URL completa de uma tela da aplicação (ver `baseUrlDaTela`). */
export function urlDaTela(
  application: { baseUrl: string; portalUrl?: string },
  rota: string | null | undefined,
  origem?: string | null
): string | undefined {
  return buildScreenUrl(baseUrlDaTela(application, origem), rota);
}

/**
 * Monta a URL de uma tela a partir da URL base da aplicação e da rota.
 *
 * Exemplo: ("http://host:8588", "/cotacoes") -> "http://host:8588/?workspace=1#/cotacoes"
 */
export function buildScreenUrl(
  baseUrl: string,
  route: string | null | undefined
): string | undefined {

  if (!route?.trim() || !baseUrl?.trim()) {
    return undefined;
  }

  const normalizedBaseUrl =
    baseUrl.endsWith('/')
      ? baseUrl
      : `${baseUrl}/`;

  const normalizedRoute =
    route.startsWith('/')
      ? route.substring(1)
      : route;

  return marcarUrlWorkspace(`${normalizedBaseUrl}#/${normalizedRoute}`);
}
