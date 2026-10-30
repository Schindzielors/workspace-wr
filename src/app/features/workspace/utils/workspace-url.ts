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

/**
 * Monta a URL de uma tela a partir da URL base da aplicação e da rota.
 *
 * Exemplo: ("http://host:8588", "/cotacoes") -> "http://host:8588/#/cotacoes"
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

  return `${normalizedBaseUrl}#/${normalizedRoute}`;
}
