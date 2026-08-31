import {
  Component,
  effect,
  inject
} from '@angular/core';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { WorkspaceTabsService } from '../service/workspace-tabs.service';

@Component({
  selector: 'app-iframe-host',
  imports: [],
  templateUrl: './iframe-host.html',
  styleUrl: './iframe-host.scss'
})
export class IframeHost {

  /**
   * Serviço responsável pelo gerenciamento das abas abertas no Workspace.
   *
   * Através dele, este componente consegue consultar:
   * - quais abas estão abertas;
   * - qual aba está atualmente ativa;
   * - os dados necessários para renderizar cada iframe.
   *
   * O serviço é exposto como readonly porque o template utiliza diretamente
   * seus Signals para reagir às alterações das abas.
   */
  readonly tabsService = inject(WorkspaceTabsService);

  /**
   * Serviço nativo do Angular utilizado para tratar URLs que serão atribuídas
   * ao atributo `src` dos iframes.
   *
   * Por segurança, o Angular considera URLs utilizadas em recursos externos
   * como potencialmente inseguras. Como as URLs exibidas pelo Workspace serão
   * provenientes de aplicações previamente conhecidas/configuradas
   * (Portal WR, Web Rodopar, Rodopar etc.), utilizamos o DomSanitizer para
   * autorizar explicitamente sua utilização no iframe.
   *
   * IMPORTANTE:
   * `bypassSecurityTrustResourceUrl` não deve ser utilizado com URLs
   * arbitrárias fornecidas diretamente pelo usuário.
   *
   * No futuro, quando as aplicações e URLs forem fornecidas pela API do
   * Workspace, elas deverão passar por uma estratégia de validação/allowlist
   * antes de serem consideradas confiáveis.
   */
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Cache das URLs já sanitizadas, indexado pelo identificador único da aba.
   *
   * Exemplo:
   *
   * "portal-wr-cotacoes-aberto" -> SafeResourceUrl(...)
   * "web-rodopar-veiculos"      -> SafeResourceUrl(...)
   *
   * Este cache possui uma responsabilidade importante além de simplesmente
   * evitar sanitizações repetidas.
   *
   * O método `bypassSecurityTrustResourceUrl` retorna um novo objeto
   * SafeResourceUrl sempre que é executado. Se criássemos esse objeto
   * novamente a cada ciclo de detecção de mudanças do Angular, o binding
   * `[src]` do iframe poderia receber uma nova referência.
   *
   * Essa nova referência poderia fazer o navegador reatribuir o `src`
   * e recarregar o iframe. Como consequência, a aplicação embarcada
   * poderia perder seu estado atual, incluindo:
   * - rota/tela atual;
   * - filtros aplicados;
   * - formulários em preenchimento;
   * - posição de scroll;
   * - modais abertos;
   * - demais estados mantidos pela aplicação.
   *
   * Portanto, enquanto uma aba permanecer aberta, reutilizamos exatamente
   * a mesma instância de SafeResourceUrl.
   *
   * Quando a aba é fechada, sua entrada é removida deste Map pelo `effect`
   * definido no construtor, permitindo que referências que não são mais
   * necessárias sejam liberadas durante sessões longas do Workspace.
   */
  private readonly safeUrls = new Map<string, SafeResourceUrl>();

  constructor() {

    /**
     * Monitora reativamente a coleção de abas abertas e mantém o cache
     * `safeUrls` sincronizado com o ciclo de vida dessas abas.
     *
     * O `effect` é executado novamente sempre que o Signal `tabs` sofre
     * uma alteração.
     *
     * Para cada execução:
     * 1. obtemos os IDs de todas as abas que continuam abertas;
     * 2. percorremos as URLs atualmente armazenadas no cache;
     * 3. removemos qualquer entrada cuja aba não exista mais.
     *
     * Essa limpeza é especialmente importante porque o Workspace foi
     * projetado para permanecer aberto durante longas sessões de trabalho.
     * Sem essa sincronização, abrir e fechar muitas telas ao longo do dia
     * faria o Map manter referências de abas que já não existem.
     *
     * Exemplo:
     *
     * Abas abertas:
     * [A] [B] [C]
     *
     * Cache:
     * A -> SafeResourceUrl
     * B -> SafeResourceUrl
     * C -> SafeResourceUrl
     *
     * Após fechar B:
     *
     * Abas abertas:
     * [A] [C]
     *
     * O effect identifica que B deixou de existir e remove sua entrada:
     *
     * Cache:
     * A -> SafeResourceUrl
     * C -> SafeResourceUrl
     *
     * Dessa forma, o cache acompanha o ciclo de vida real das abas sem
     * criar acoplamento entre o WorkspaceTabsService e o IframeHost.
     */
    effect(() => {
      const openTabIds = new Set(
        this.tabsService.tabs().map(tab => tab.id)
      );

      for (const tabId of this.safeUrls.keys()) {

        // Se o ID armazenado no cache não pertence mais a nenhuma aba
        // aberta, sua SafeResourceUrl também não precisa mais ser mantida.
        if (!openTabIds.has(tabId)) {
          this.safeUrls.delete(tabId);
        }
      }
    });
  }

  /**
   * Retorna uma URL segura para utilização no atributo `src` do iframe.
   *
   * Antes de criar uma nova SafeResourceUrl, o método verifica se aquela
   * aba já possui uma URL sanitizada armazenada no cache.
   *
   * Caso exista:
   * - a mesma instância é retornada;
   * - o `src` do iframe permanece estável;
   * - o iframe não precisa ser recarregado;
   * - o estado interno da aplicação embarcada é preservado.
   *
   * Caso ainda não exista:
   * 1. a URL recebida é marcada explicitamente como confiável;
   * 2. a SafeResourceUrl resultante é armazenada utilizando o ID da aba;
   * 3. essa mesma referência será reutilizada enquanto a aba permanecer
   *    aberta no Workspace.
   *
   * Quando a aba for fechada, o `effect` definido no construtor removerá
   * automaticamente essa referência do cache.
   *
   * Dessa forma, temos dois comportamentos distintos:
   *
   * Trocar de aba:
   * → preserva iframe e estado da aplicação.
   *
   * Fechar a aba:
   * → remove iframe e URL armazenada em cache.
   *
   * @param tabId Identificador único da aba dentro do Workspace.
   *              É utilizado como chave para localizar a URL no cache.
   *
   * @param url URL da aplicação/tela que será carregada dentro do iframe.
   *
   * @returns URL considerada segura pelo Angular para utilização como
   *          Resource URL no iframe.
   */
  getSafeUrl(
    tabId: string,
    url: string
  ): SafeResourceUrl {

    // Verifica se esta aba já possui uma SafeResourceUrl criada anteriormente.
    const existingUrl = this.safeUrls.get(tabId);

    // Reutiliza exatamente a mesma referência enquanto a aba permanecer
    // aberta. Isso evita reatribuições desnecessárias ao `src` do iframe.
    if (existingUrl) {
      return existingUrl;
    }

    /**
     * Autoriza explicitamente a URL para utilização como Resource URL.
     *
     * Esta operação pressupõe que a URL pertence a uma aplicação confiável
     * e previamente cadastrada/configurada pelo Workspace.
     */
    const safeUrl =
      this.sanitizer.bypassSecurityTrustResourceUrl(url);

    // Mantém a referência em cache durante todo o ciclo de vida da aba.
    this.safeUrls.set(tabId, safeUrl);

    return safeUrl;
  }
}