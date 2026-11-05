/** Critérios da nova senha (tela "Defina sua nova senha"). A API valida os mesmos. */
export interface SenhaCriterio {
  id: 'tamanho' | 'composicao' | 'iguais';
  texto: string;
  ok: boolean;
}

export function avaliarSenha(senha: string, confirmacao: string): SenhaCriterio[] {
  return [
    { id: 'tamanho', texto: 'Mínimo de 8 caracteres', ok: senha.length >= 8 },
    {
      id: 'composicao',
      texto: 'Combine letras, números e símbolos',
      ok: /\p{L}/u.test(senha) && /\d/.test(senha) && /[^\p{L}\d\s]/u.test(senha)
    },
    { id: 'iguais', texto: 'As senhas são iguais', ok: !!senha && senha === confirmacao }
  ];
}
