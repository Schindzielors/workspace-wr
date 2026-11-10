import { effect, inject, Injectable, untracked } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceVisaoService } from '../service/workspace-visao.service';
import {
  MENSAGEM_PEDIR_SESSAO,
  MENSAGEM_SESSAO,
  MENSAGEM_VISAO,
  PROTOCOLO_VERSAO,
  SessaoMensagem,
  VisaoAlteradaMensagem,
  VisaoItemMensagem,
  VisaoMensagem
} from './workspace-embed.protocolo';

/** Nome dos iframes das abas (IframeHost). */
const NOME_IFRAME = 'dtp-workspace';

interface PedidoPendente {
  janela: Window;
  origem: string;
}

/**
 * Ponte entre o Workspace e os sistemas abertos nas abas (postMessage).
 *
 * - Quando um sistema pede a sessão, responde com o token do usuário e as
 *   filiais da visão atual. Assim o sistema não mostra a tela de login nem a
 *   de seleção de filiais dentro do iframe.
 * - Quando o usuário troca a visão no header, avisa todas as abas.
 *
 * Só responde para iframes do próprio Workspace e só para a origem exata da
 * URL que a aba abriu, então o token não vai para nenhum outro site.
 * Protocolo: workspace-embed.protocolo.ts.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceEmbedPonteService {
  private readonly auth = inject(AuthService);
  private readonly visaoService = inject(WorkspaceVisaoService);

  private iniciado = false;

  /** Pedidos que chegaram antes de a visão carregar. */
  private pendentes: PedidoPendente[] = [];

  /** Últimas filiais avisadas às abas (para só avisar quando mudar). */
  private ultimasFiliais: string | null = null;

  constructor() {
    effect(() => {
      const filiais = this.visaoService.codigosFiliais();
      const falhou = this.visaoService.falhou();

      untracked(() => {
        if (filiais !== null || falhou) {
          this.responderPendentes();
        }

        if (filiais !== null) {
          this.avisarTrocaDeVisao(filiais);
        }
      });
    });
  }

  /** Chamado pelo shell do Workspace (só com o usuário logado). */
  iniciar(): void {
    if (this.iniciado) {
      return;
    }

    this.iniciado = true;
    this.visaoService.carregar();
    window.addEventListener('message', this.aoReceberMensagem);
  }

  // ---------------------------------------------------------------------

  private readonly aoReceberMensagem = (evento: MessageEvent): void => {
    if (evento.data?.tipo !== MENSAGEM_PEDIR_SESSAO) {
      return;
    }

    const iframe = this.iframeDaJanela(evento.source);

    // Só iframes do Workspace, e só se a mensagem vier da origem que a aba abriu.
    if (!iframe || evento.origin !== origemDe(iframe.src) || !this.auth.accessToken()) {
      return;
    }

    const pedido: PedidoPendente = { janela: evento.source as Window, origem: evento.origin };

    if (this.visaoService.codigosFiliais() === null && !this.visaoService.falhou()) {
      this.pendentes.push(pedido);
      return;
    }

    this.enviarSessao(pedido);
  };

  private responderPendentes(): void {
    const pedidos = this.pendentes;
    this.pendentes = [];
    pedidos.forEach(pedido => this.enviarSessao(pedido));
  }

  private enviarSessao({ janela, origem }: PedidoPendente): void {
    const token = this.auth.accessToken();

    if (!token) {
      return;
    }

    const mensagem: SessaoMensagem = {
      tipo: MENSAGEM_SESSAO,
      versao: PROTOCOLO_VERSAO,
      token,
      expiraEm: this.auth.expiracao(),
      filiais: this.visaoService.codigosFiliais() ?? [],
      visao: this.visaoAtual()
    };

    janela.postMessage(mensagem, origem);
  }

  /** Troca de visão no header: avisa todas as abas abertas. */
  private avisarTrocaDeVisao(filiais: number[]): void {
    const chave = JSON.stringify(filiais);
    const primeiraVez = this.ultimasFiliais === null;

    if (chave === this.ultimasFiliais) {
      return;
    }

    this.ultimasFiliais = chave;

    if (primeiraVez) {
      return;
    }

    const mensagem: VisaoAlteradaMensagem = {
      tipo: MENSAGEM_VISAO,
      versao: PROTOCOLO_VERSAO,
      filiais,
      visao: this.visaoAtual()
    };

    this.iframes().forEach(iframe => {
      const origem = origemDe(iframe.src);

      if (origem && iframe.contentWindow) {
        iframe.contentWindow.postMessage(mensagem, origem);
      }
    });
  }

  private visaoAtual(): VisaoMensagem | null {
    const atual = this.visaoService.atual();

    if (!atual) {
      return null;
    }

    const item = (id: string | null): VisaoItemMensagem | null => {
      const no = this.visaoService.no(id);
      return no ? { codigo: no.codigo, nome: no.nome } : null;
    };

    return { grupo: item(atual.idGrupo), empresa: item(atual.idEmpresa), filial: item(atual.idFilial) };
  }

  private iframes(): HTMLIFrameElement[] {
    return Array.from(document.querySelectorAll<HTMLIFrameElement>(`iframe[name="${NOME_IFRAME}"]`));
  }

  private iframeDaJanela(janela: MessageEventSource | null): HTMLIFrameElement | undefined {
    return janela ? this.iframes().find(iframe => iframe.contentWindow === janela) : undefined;
  }
}

function origemDe(url: string): string | null {
  try {
    const origem = new URL(url, window.location.href).origin;
    return origem === 'null' ? null : origem;
  } catch {
    return null;
  }
}
