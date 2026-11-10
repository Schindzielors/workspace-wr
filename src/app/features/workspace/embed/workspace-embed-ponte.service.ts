import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, untracked } from '@angular/core';

import { appConfig } from '../../../core/config/app-config';
import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceVisaoService } from '../service/workspace-visao.service';
import {
  MENSAGEM_PEDIR_SESSAO,
  MENSAGEM_SESSAO,
  MENSAGEM_SESSAO_EXPIRADA,
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
 * - Quando um sistema avisa que a sessão expirou (401 que a renovação não
 *   resolveu), confere a sessão do Workspace: token vencido ou recusado pela
 *   API leva ao login do Workspace; token válido é reenviado para a aba.
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
  private readonly http = inject(HttpClient);
  private readonly visaoService = inject(WorkspaceVisaoService);

  private iniciado = false;

  /** Pedidos que chegaram antes de a visão carregar. */
  private pendentes: PedidoPendente[] = [];

  /** Últimas filiais avisadas às abas (para só avisar quando mudar). */
  private ultimasFiliais: string | null = null;

  /** Conferência de sessão em andamento (vários avisos geram uma chamada só). */
  private conferindoSessao = false;

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
    const tipo = evento.data?.tipo;

    if (tipo !== MENSAGEM_PEDIR_SESSAO && tipo !== MENSAGEM_SESSAO_EXPIRADA) {
      return;
    }

    const iframe = this.iframeDaJanela(evento.source);

    // Só iframes do Workspace, e só se a mensagem vier da origem que a aba abriu.
    if (!iframe || evento.origin !== origemDe(iframe.src) || !this.auth.accessToken()) {
      return;
    }

    const pedido: PedidoPendente = { janela: evento.source as Window, origem: evento.origin };

    if (tipo === MENSAGEM_SESSAO_EXPIRADA) {
      this.conferirSessao(pedido);
      return;
    }

    if (this.visaoService.codigosFiliais() === null && !this.visaoService.falhou()) {
      this.pendentes.push(pedido);
      return;
    }

    this.enviarSessao(pedido);
  };

  /**
   * Um sistema recebeu 401 mesmo depois de renovar. Se o token do Workspace
   * venceu, vai para o login. Senão, testa o token na API: 401 lá faz o
   * interceptor do Workspace levar ao login; se a API aceitar, o problema era
   * do sistema e a sessão é reenviada para a aba.
   */
  private conferirSessao(pedido: PedidoPendente): void {
    const expiracao = this.auth.expiracao();

    if (expiracao !== null && expiracao <= Date.now() / 1000) {
      this.auth.encerrarLocalmente();
      return;
    }

    if (this.conferindoSessao) {
      return;
    }

    this.conferindoSessao = true;

    this.http.get(`${appConfig.apiUrl}/api/WorkspaceUsuario/Perfil`).subscribe({
      next: () => {
        this.conferindoSessao = false;
        this.enviarSessao(pedido);
      },
      // 401: o authInterceptor já leva ao login. Outros erros: nada a fazer aqui.
      error: () => (this.conferindoSessao = false)
    });
  }

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
