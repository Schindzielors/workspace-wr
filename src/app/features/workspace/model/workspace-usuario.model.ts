export interface WorkspaceUsuarioPerfil {
  nome: string;
  email: string;
  cargo: string;
  fotoUrl: string | null;
  idioma: string;
}

export interface WorkspaceNotificacao {
  id: number;
  titulo: string;
  descricao: string;
  ativo: boolean;
}

/** Idiomas oferecidos em Configurações. */
export const IDIOMAS = [
  { value: 'pt-BR', label: 'Português' },
  { value: 'en-US', label: 'English' },
  { value: 'es-ES', label: 'Español' }
];
