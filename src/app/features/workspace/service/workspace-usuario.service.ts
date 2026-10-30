import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';

import { appConfig } from '../../../core/config/app-config';
import {
  WorkspaceNotificacaoDto,
  WorkspaceUsuarioFotoDto,
  WorkspaceUsuarioPerfilDto,
  WorkspaceUsuarioPerfilRequestDto
} from '../dto/workspace-usuario.dto';
import { WorkspaceNotificacao, WorkspaceUsuarioPerfil } from '../model/workspace-usuario.model';

interface ListResponseDto<T> {
  items: T[];
  totalItems: number;
}

/**
 * Perfil e preferências do usuário logado: header, saudação da Home,
 * menu do usuário, Configurações e Notificações.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${appConfig.apiUrl}/api/WorkspaceUsuario`;

  private readonly _perfil = signal<WorkspaceUsuarioPerfil | null>(null);
  private readonly _notificacoes = signal<WorkspaceNotificacao[] | null>(null);
  private readonly _erroNotificacoes = signal(false);
  private carregado = false;

  /** `null` enquanto carrega. */
  readonly perfil = this._perfil.asReadonly();
  readonly notificacoes = this._notificacoes.asReadonly();
  readonly erroNotificacoes = this._erroNotificacoes.asReadonly();

  /** "Bruno Schindzielors" -> "Bruno" (header e saudação). */
  readonly primeiroNome = computed(() => this._perfil()?.nome.trim().split(/\s+/)[0] ?? '');

  /** "Bruno Schindzielors" -> "BS" (avatar sem foto). */
  readonly iniciais = computed(() => iniciais(this._perfil()?.nome ?? ''));

  /** GET Perfil. Carrega uma vez. */
  carregar(): void {
    if (this.carregado) {
      return;
    }

    this.carregado = true;

    this.http
      .get<WorkspaceUsuarioPerfilDto>(`${this.apiUrl}/Perfil`)
      .subscribe({
        next: dto => this._perfil.set(this.mapPerfil(dto)),
        error: erro => console.error('Usuário: falha ao carregar o perfil.', erro)
      });
  }

  /**
   * Salva Configurações: envia a foto (se houver uma nova) e depois o nome e
   * o idioma. O header só muda depois que a API confirmar.
   */
  salvarPerfil(dados: { nome: string; idioma: string }, foto: File | null): Observable<void> {
    const enviarFoto$ = foto ? this.enviarFoto(foto) : of(this._perfil()?.fotoUrl ?? null);

    return enviarFoto$.pipe(
      switchMap(fotoUrl => {
        const body: WorkspaceUsuarioPerfilRequestDto = { Nome: dados.nome, Idioma: dados.idioma };

        return this.http.put(`${this.apiUrl}/Perfil`, body).pipe(
          tap(() => this._perfil.update(perfil => perfil && {
            ...perfil,
            nome: dados.nome,
            idioma: dados.idioma,
            fotoUrl
          }))
        );
      }),
      map(() => undefined)
    );
  }

  /** GET Notificacoes (recarrega a cada abertura do modal). */
  carregarNotificacoes(): void {
    this._erroNotificacoes.set(false);

    this.http
      .get<ListResponseDto<WorkspaceNotificacaoDto>>(`${this.apiUrl}/Notificacoes`)
      .pipe(map(response => response.items.map(dto => ({
        id: dto.Id,
        titulo: dto.Titulo,
        descricao: dto.Descricao,
        ativo: dto.Ativo
      }))))
      .subscribe({
        next: notificacoes => this._notificacoes.set(notificacoes),
        error: erro => {
          console.error('Usuário: falha ao carregar as notificações.', erro);
          this._erroNotificacoes.set(true);
        }
      });
  }

  /**
   * PUT Notificacoes/{id}. Otimista: o toggle muda na hora e volta se a API
   * falhar. Retorna o Observable para o modal avisar o erro.
   */
  alterarNotificacao(id: number, ativo: boolean): Observable<unknown> {
    const anterior = this._notificacoes();

    this._notificacoes.update(lista =>
      lista?.map(notificacao => notificacao.id === id ? { ...notificacao, ativo } : notificacao) ?? null
    );

    return this.http
      .put(`${this.apiUrl}/Notificacoes/${id}`, { Ativo: ativo })
      .pipe(tap({ error: () => this._notificacoes.set(anterior) }));
  }

  private enviarFoto(foto: File): Observable<string> {
    const form = new FormData();
    form.append('arquivo', foto);

    return this.http
      .post<WorkspaceUsuarioFotoDto>(`${this.apiUrl}/Foto`, form)
      .pipe(map(dto => dto.FotoUrl));
  }

  private mapPerfil(dto: WorkspaceUsuarioPerfilDto): WorkspaceUsuarioPerfil {
    return {
      nome: dto.Nome,
      email: dto.Email,
      cargo: dto.Cargo,
      fotoUrl: dto.FotoUrl,
      idioma: dto.Idioma
    };
  }
}

/** Primeira e última inicial do nome ("Bruno Schindzielors" -> "BS"). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);

  if (!partes.length) {
    return '';
  }

  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';

  return (primeira + ultima).toLocaleUpperCase();
}
