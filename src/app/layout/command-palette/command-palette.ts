import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';

import { HomeService } from '../../features/home/service/home.service';
import { HomeConector, HomePainel } from '../../features/home/model/home.model';
import { WorkspaceApplication } from '../../features/workspace/model/workspace-application.model';
import { WorkspaceMenuItem } from '../../features/workspace/model/workspace-menu-item.model';
import { WorkspaceFavoritosService } from '../../features/workspace/service/workspace-favoritos.service';
import { WorkspaceSessionService } from '../../features/workspace/service/workspace-session.service';
import { buildScreenUrl } from '../../features/workspace/utils/workspace-url';
import { Icon, IconName } from '../../shared/icon/icon';
import { applicationIcon } from '../../shared/icon/application-icon';
import { PaletteAcao, PaletteFiltro, PaletteItem } from './command-palette.model';

interface PaletteGrupo {
  nome: string;
  itens: PaletteItem[];
}

interface PaletteAbaFiltro {
  filtro: PaletteFiltro;
  rotulo: string;
  icon?: IconName;
}

/** Quantas buscas recentes guardar/exibir. */
const MAX_RECENTES = 5;
const CHAVE_RECENTES = 'buscas-recentes';

/**
 * Busca global do header ("Telas, sistemas e comandos...") — Figma
 * "Home - Barra de busca v1".
 *
 * Abre sobre a tela (clique no campo do header ou Ctrl+K / ⌘K) e procura em:
 * telas do menu de cada aplicação, aplicações sem menu (ex.: Rodopar),
 * favoritos, painéis e conectores. Teclado: ↑↓ navega, Enter abre, Esc fecha.
 */
@Component({
  selector: 'app-command-palette',
  imports: [Icon],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'onKeydown($event)'
  }
})
export class CommandPalette {
  private readonly favoritosService = inject(WorkspaceFavoritosService);
  private readonly homeService = inject(HomeService);
  private readonly session = inject(WorkspaceSessionService);

  readonly applications = input.required<WorkspaceApplication[]>();

  /** Item escolhido (o shell executa a ação e fecha a busca). */
  readonly escolhido = output<PaletteAcao>();
  readonly fechar = output<void>();

  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly results = viewChild<ElementRef<HTMLElement>>('results');

  readonly termo = signal('');
  readonly filtro = signal<PaletteFiltro>('todos');
  readonly indiceAtivo = signal(0);

  private readonly conectores = signal<HomeConector[]>([]);
  private readonly paineis = signal<HomePainel[]>([]);
  private readonly recentes = signal<PaletteItem[]>(
    this.session.ler<PaletteItem[]>(CHAVE_RECENTES) ?? []
  );

  /** Abas de filtro: Todos, uma por aplicação, Favoritos, Conectores, Painéis. */
  readonly abas = computed<PaletteAbaFiltro[]>(() => [
    { filtro: 'todos', rotulo: 'Todos' },
    ...this.applications().map(application => ({
      filtro: application.system,
      rotulo: application.title,
      icon: applicationIcon(application)
    })),
    { filtro: 'favoritos', rotulo: 'Favoritos', icon: 'star' },
    { filtro: 'conectores', rotulo: 'Conectores', icon: 'usb' },
    { filtro: 'paineis', rotulo: 'Painéis', icon: 'grid-nine' }
  ]);

  /** Todos os itens pesquisáveis, montados a partir dos dados já carregados. */
  private readonly todosItens = computed<PaletteItem[]>(() => [
    ...this.itensDasAplicacoes(),
    ...this.itensFavoritos(),
    ...this.itensPaineis(),
    ...this.itensConectores()
  ]);

  /** Grupos exibidos, já filtrados pela aba e pelo texto digitado. */
  readonly grupos = computed<PaletteGrupo[]>(() => {
    const filtro = this.filtro();
    const termo = normalizar(this.termo());
    const itens = this.todosItens().filter(item =>
      (filtro === 'todos' || item.filtro === filtro) && corresponde(item, termo)
    );

    const grupos: PaletteGrupo[] = [];

    if (!termo && filtro === 'todos' && this.recentes().length) {
      grupos.push({ nome: 'Buscas recentes', itens: this.recentes() });
    }

    for (const item of itens) {
      const grupo = grupos.find(g => g.nome === item.grupo);
      grupo ? grupo.itens.push(item) : grupos.push({ nome: item.grupo, itens: [item] });
    }

    return grupos;
  });

  /** Itens que podem ser escolhidos, na ordem da tela (navegação ↑↓). */
  readonly selecionaveis = computed(() =>
    this.grupos().flatMap(grupo =>
      grupo.itens
        .filter(item => item.acao.tipo !== 'nenhuma')
        .map(item => ({ item, id: this.idDoItem(grupo, item) }))
    )
  );

  readonly idAtivo = computed(() => this.selecionaveis()[this.indiceAtivo()]?.id ?? null);

  constructor() {
    this.favoritosService.carregar();

    this.homeService.carregarConectores().subscribe({
      next: conectores => this.conectores.set(conectores),
      error: erro => console.error('Busca: falha ao carregar conectores.', erro)
    });

    this.homeService.carregarPaineis().subscribe({
      next: paineis => this.paineis.set(paineis),
      error: erro => console.error('Busca: falha ao carregar painéis.', erro)
    });

    afterNextRender(() => this.searchInput().nativeElement.focus());
  }

  atualizarTermo(event: Event): void {
    this.termo.set((event.target as HTMLInputElement).value);
    this.indiceAtivo.set(0);
  }

  selecionarFiltro(filtro: PaletteFiltro): void {
    this.filtro.set(filtro);
    this.indiceAtivo.set(0);
    this.searchInput().nativeElement.focus();
  }

  idDoItem(grupo: PaletteGrupo, item: PaletteItem): string {
    return `busca-${normalizarId(grupo.nome)}-${normalizarId(item.chave)}`;
  }

  ativarPorMouse(grupo: PaletteGrupo, item: PaletteItem): void {
    const indice = this.selecionaveis().findIndex(s => s.id === this.idDoItem(grupo, item));

    if (indice >= 0) {
      this.indiceAtivo.set(indice);
    }
  }

  escolher(item: PaletteItem): void {
    if (item.acao.tipo === 'nenhuma') {
      return;
    }

    this.guardarRecente(item);
    this.escolhido.emit(item.acao);
  }

  onKeydown(event: KeyboardEvent): void {
    const total = this.selecionaveis().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (total) {
          this.moverAtivo((this.indiceAtivo() + 1) % total);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (total) {
          this.moverAtivo((this.indiceAtivo() - 1 + total) % total);
        }
        break;

      case 'Enter': {
        const ativo = this.selecionaveis()[this.indiceAtivo()];
        if (ativo) {
          event.preventDefault();
          this.escolher(ativo.item);
        }
        break;
      }

      case 'Escape':
        event.preventDefault();
        this.fechar.emit();
        break;
    }
  }

  private moverAtivo(indice: number): void {
    this.indiceAtivo.set(indice);

    // Depois de renderizar, garante que o item ativo está visível na lista.
    requestAnimationFrame(() => {
      const id = this.idAtivo();
      const elemento = id ? this.results()?.nativeElement.querySelector(`#${id}`) : null;
      elemento?.scrollIntoView({ block: 'nearest' });
    });
  }

  private guardarRecente(item: PaletteItem): void {
    const recentes = [
      { ...item, grupo: 'Buscas recentes' },
      ...this.recentes().filter(recente => recente.chave !== item.chave)
    ].slice(0, MAX_RECENTES);

    this.recentes.set(recentes);
    this.session.salvar(CHAVE_RECENTES, recentes);
  }

  // ---------------------------------------------------------------------
  // Montagem dos itens
  // ---------------------------------------------------------------------

  private itensDasAplicacoes(): PaletteItem[] {
    return this.applications().flatMap((application): PaletteItem[] => {
      const icon = applicationIcon(application);

      // Sem menu (ex.: Rodopar): a própria aplicação é o item.
      if (!application.possuiMenu) {
        return [{
          chave: `app-${application.id}`,
          titulo: application.title,
          caminho: 'Abrir sistema',
          icon,
          grupo: application.title,
          filtro: application.system,
          acao: { tipo: 'aplicacao', applicationId: application.id }
        } satisfies PaletteItem];
      }

      return telasDoMenu(application.menus).map(({ item, caminho }) => ({
        chave: `menu-${item.id}`,
        titulo: item.title,
        caminho: caminho.join(' / '),
        icon,
        grupo: application.title,
        filtro: application.system,
        acao: {
          tipo: 'tela',
          id: item.id,
          titulo: item.title,
          sistema: application.system,
          url: item.url!
        }
      } satisfies PaletteItem));
    });
  }

  private itensFavoritos(): PaletteItem[] {
    return (this.favoritosService.favoritos() ?? []).map(favorito => ({
      chave: `favorito-${favorito.idMenu}`,
      titulo: favorito.titulo,
      caminho: [favorito.categoria, favorito.subcategoria].filter(Boolean).join(' / '),
      icon: 'star',
      grupo: 'Favoritos',
      filtro: 'favoritos',
      // Mesmo id da aba do menu: não duplica a tela.
      acao: this.acaoTela(favorito.idMenu, favorito.titulo, favorito.sistema, favorito.rota)
    }));
  }

  private itensPaineis(): PaletteItem[] {
    return this.paineis().map(painel => ({
      chave: `painel-${painel.id}`,
      titulo: painel.titulo,
      icon: 'grid-nine',
      grupo: 'Painéis',
      filtro: 'paineis',
      acao: this.acaoTela(`painel-${painel.id}`, painel.titulo, painel.sistema, painel.rota)
    }));
  }

  private itensConectores(): PaletteItem[] {
    return this.conectores().map(conector => ({
      chave: `conector-${conector.id}`,
      titulo: conector.nome,
      caminho: `${conector.categoria} · em desenvolvimento`,
      icon: 'usb',
      grupo: 'Conectores',
      filtro: 'conectores',
      acao: { tipo: 'nenhuma' }
    }));
  }

  /** Ação de abrir tela; sem aplicação ou rota válida, o item fica sem ação. */
  private acaoTela(id: string, titulo: string, sistema?: string, rota?: string): PaletteAcao {
    const application = this.applications().find(item => item.system === sistema);
    const url = application && buildScreenUrl(application.baseUrl, rota);

    return application && url
      ? { tipo: 'tela', id, titulo, sistema: application.system, url }
      : { tipo: 'nenhuma' };
  }
}

/** Telas (itens com URL) do menu, com as pastas acima de cada uma. */
function telasDoMenu(
  itens: WorkspaceMenuItem[],
  caminho: string[] = []
): { item: WorkspaceMenuItem; caminho: string[] }[] {
  return itens.flatMap(item => [
    ...(item.url ? [{ item, caminho }] : []),
    ...telasDoMenu(item.children ?? [], [...caminho, item.title])
  ]);
}

/** Minúsculas e sem acentos, para "cotacao" encontrar "Cotação". */
function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Todas as palavras digitadas precisam aparecer no título, caminho ou grupo. */
function corresponde(item: PaletteItem, termo: string): boolean {
  if (!termo) {
    return true;
  }

  const alvo = normalizar(`${item.titulo} ${item.caminho ?? ''} ${item.grupo}`);
  return termo.split(/\s+/).every(palavra => alvo.includes(palavra));
}

function normalizarId(texto: string): string {
  return normalizar(texto).replace(/[^a-z0-9]+/g, '-');
}
