import { Injectable } from '@angular/core';

/**
 * Estado do Workspace guardado durante a sessão do usuário.
 *
 * Usa o `sessionStorage` do navegador:
 * - sobrevive ao recarregar a página (F5);
 * - some ao fechar a aba/janela do navegador;
 * - é separado por aba do navegador.
 *
 * LOGIN / LOGOUT:
 * Ainda não há login no front. Quando houver, o logout deve chamar
 * `limpar()`: assim, ao logar de novo, o Workspace começa sem abas.
 * Se o login trocar de usuário sem logout (ex.: token expirado e outro
 * usuário entrando), chame `limpar()` também ao detectar a troca.
 *
 * Todas as leituras e escritas são protegidas: se o navegador bloquear o
 * armazenamento (modo privado, cota cheia), o Workspace funciona normalmente,
 * apenas sem restaurar o estado.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceSessionService {
  /** Prefixo e versão das chaves. Mude a versão se o formato salvo mudar. */
  private readonly prefixo = 'workspace.v1.';

  ler<T>(chave: string): T | null {
    try {
      const valor = sessionStorage.getItem(this.prefixo + chave);
      return valor ? JSON.parse(valor) as T : null;
    } catch {
      return null;
    }
  }

  salvar(chave: string, valor: unknown): void {
    try {
      sessionStorage.setItem(this.prefixo + chave, JSON.stringify(valor));
    } catch {
      // Armazenamento indisponível: segue sem persistir.
    }
  }

  /** Apaga todo o estado do Workspace (chamar no logout). */
  limpar(): void {
    try {
      Object.keys(sessionStorage)
        .filter(chave => chave.startsWith(this.prefixo))
        .forEach(chave => sessionStorage.removeItem(chave));
    } catch {
      // Armazenamento indisponível: nada a limpar.
    }
  }
}
