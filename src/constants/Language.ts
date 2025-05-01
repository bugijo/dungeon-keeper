
/**
 * Este arquivo define a linguagem padrão da aplicação
 */

export const DEFAULT_LANGUAGE = 'pt-br';

/**
 * Função para verificar se um texto está em português
 * @param text O texto a ser verificado
 * @returns true se o texto contiver caracteres específicos do português
 */
export const isPortuguese = (text: string): boolean => {
  // Letras acentuadas comuns em português
  const ptChars = ['á', 'à', 'â', 'ã', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç'];
  
  // Palavras comuns em português
  const ptWords = ['não', 'sim', 'por', 'para', 'como', 'onde', 'quando', 'quem', 'porque', 'qual'];
  
  // Verificar por caracteres específicos
  for (const char of ptChars) {
    if (text.toLowerCase().includes(char)) {
      return true;
    }
  }
  
  // Verificar por palavras comuns
  for (const word of ptWords) {
    if (text.toLowerCase().includes(` ${word} `)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Conjunto de mensagens do sistema em português
 */
export const PT_BR_MESSAGES = {
  // Mensagens de autenticação
  auth: {
    loginSuccess: (nome: string) => `🔥 Tochas Acesas! Bem-vindo, ${nome || 'Aventureiro'}!`,
    loginError: "🧙 Magia Falhou! Credenciais incorretas.",
    signupSuccess: "🛡️ Bem-vindo à Guilda! Verifique seu email.",
    signupError: "🪶 Pergaminho Danificado! Não foi possível criar conta.",
    accountLocked: "🛡️ Portal Bloqueado! Muitas tentativas.",
    resetPassword: "🔮 Feitiço Enviado! Verifique seu email.",
    logoutSuccess: "🌙 As tochas foram apagadas! Até a próxima aventura!",
    verifyEmail: "📜 Pergaminho enviado! Verifique seu email.",
    genericError: "🧝‍♂️ Por elfos! Algo deu errado."
  },
  
  // Mensagens da interface
  ui: {
    loading: "Carregando...",
    error: "Ocorreu um erro",
    success: "Operação concluída com sucesso",
    noResults: "Nenhum resultado encontrado",
    required: "Este campo é obrigatório",
    invalidEmail: "Email inválido",
    passwordTooShort: "A senha deve ter pelo menos 6 caracteres",
    confirmPassword: "As senhas não coincidem",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    edit: "Editar",
    create: "Criar",
    search: "Buscar"
  },
  
  // Mensagens de jogo
  game: {
    criticalSuccess: "Sucesso Crítico!",
    criticalFailure: "Falha Crítica!",
    levelUp: "Subiu de Nível!",
    newQuest: "Nova Missão Adicionada!",
    questCompleted: "Missão Concluída!",
    itemFound: "Item Encontrado!",
    noMana: "Mana Insuficiente!",
    rest: "Descansando..."
  }
};
