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
 * (sem header e sem menu lateral) quando estão em um iframe E a URL tem
 * esse parâmetro. Quem abre o sistema direto continua vendo o layout normal.
 * Antes do `#` ele não se perde quando o sistema troca de rota.
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
