import { IconName } from '../../shared/icon/icon';

/** O que acontece ao escolher um item da busca global. */
export type PaletteAcao =
  /** Abre uma tela em uma aba (itens de menu, favoritos, painéis). */
  | { tipo: 'tela'; id: string; titulo: string; sistema: string; url: string }
  /** Seleciona uma aplicação (ex.: Rodopar, que abre direto em aba). */
  | { tipo: 'aplicacao'; applicationId: string }
  /** Item visível, mas ainda sem destino (ex.: conectores). */
  | { tipo: 'nenhuma' };

/** Filtro (abas no topo da busca): "todos", o `system` de uma aplicação ou um tipo. */
export type PaletteFiltro = 'todos' | 'favoritos' | 'conectores' | 'paineis' | string;

export interface PaletteItem {
  /** Chave única (também usada nas buscas recentes). */
  chave: string;
  titulo: string;

  /** Texto auxiliar à direita do título (ex.: "Recursos / E-Cotação"). */
  caminho?: string;

  icon: IconName;

  /** Nome do grupo na lista (ex.: "WR", "Favoritos"). */
  grupo: string;

  /** Filtro ao qual o item pertence. */
  filtro: PaletteFiltro;

  acao: PaletteAcao;
}
