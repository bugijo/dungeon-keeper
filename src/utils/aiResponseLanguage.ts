
/**
 * Utilitário para garantir que as respostas da IA estejam em português brasileiro
 */
import { DEFAULT_LANGUAGE, isPortuguese } from '../constants/Language';

/**
 * Verifica a linguagem de entrada e prepara a resposta adequada
 * @param userInput - Texto de entrada do usuário
 * @returns Configuração para a resposta
 */
export const prepareAIResponse = (userInput: string) => {
  // Verifica se o input do usuário está em português
  const shouldRespondInPortuguese = isPortuguese(userInput) || DEFAULT_LANGUAGE === 'pt-br';
  
  // Configura as instruções para a IA
  const aiInstructions = {
    language: shouldRespondInPortuguese ? 'pt-br' : 'en',
    formalityLevel: 'casual', // casual, neutral, formal
    shouldIncludeEmojis: true,
    contextualNotes: shouldRespondInPortuguese 
      ? 'O usuário está se comunicando em português brasileiro. Sempre responda em português brasileiro.'
      : 'User is communicating in English. Respond in English.'
  };
  
  return aiInstructions;
};

/**
 * Lista de palavras-chave para detecção de comandos específicos em português
 */
export const portugueseKeywords = {
  help: ['ajuda', 'socorro', 'dúvida', 'como', 'usar'],
  create: ['criar', 'novo', 'adicionar', 'gerar'],
  edit: ['editar', 'modificar', 'alterar', 'mudar'],
  delete: ['excluir', 'deletar', 'remover', 'apagar'],
  search: ['buscar', 'procurar', 'encontrar', 'pesquisar'],
  roll: ['rolar', 'jogar', 'dados', 'd20', 'd6']
};

/**
 * Analisa o texto de entrada para identificar comandos em português
 * @param text - Texto a ser analisado
 * @returns Objeto com os comandos identificados
 */
export const parsePortugueseCommands = (text: string) => {
  const lowerText = text.toLowerCase();
  const commands = {
    isHelp: portugueseKeywords.help.some(keyword => lowerText.includes(keyword)),
    isCreate: portugueseKeywords.create.some(keyword => lowerText.includes(keyword)),
    isEdit: portugueseKeywords.edit.some(keyword => lowerText.includes(keyword)),
    isDelete: portugueseKeywords.delete.some(keyword => lowerText.includes(keyword)),
    isSearch: portugueseKeywords.search.some(keyword => lowerText.includes(keyword)),
    isDiceRoll: portugueseKeywords.roll.some(keyword => lowerText.includes(keyword))
  };
  
  return commands;
};

/**
 * Gera uma resposta em português sobre a plataforma
 */
export const getPortugueseResponse = () => {
  const responses = [
    "Bem-vindo ao Keeper of Realms! Como posso ajudar sua aventura hoje?",
    "Olá, aventureiro! Estou aqui para auxiliar em sua jornada pelo mundo dos RPGs.",
    "Saudações! O que você deseja fazer em sua próxima sessão de D&D?",
    "Bem-vindo à guilda, aventureiro! Como posso ajudar?",
    "As tochas estão acesas e estou pronto para ajudar em sua campanha!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};
