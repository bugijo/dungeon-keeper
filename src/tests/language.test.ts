
import { isPortuguese, DEFAULT_LANGUAGE } from '../constants/Language';
import { prepareAIResponse, parsePortugueseCommands } from '../utils/aiResponseLanguage';

describe('Testes de detecção de idioma', () => {
  test('Deve identificar texto em português por acentos', () => {
    expect(isPortuguese('Olá, como você está?')).toBe(true);
  });

  test('Deve identificar texto em português por palavras comuns', () => {
    expect(isPortuguese('Eu não sei como resolver isso')).toBe(true);
  });

  test('Não deve identificar texto em inglês como português', () => {
    expect(isPortuguese('Hello, how are you?')).toBe(false);
  });
});

describe('Testes de preparação de resposta da IA', () => {
  test('Deve configurar resposta em português para texto em português', () => {
    const config = prepareAIResponse('Olá, como funciona isso?');
    expect(config.language).toBe('pt-br');
  });

  test('Deve configurar resposta com base na linguagem padrão', () => {
    // Mesmo sem detectar português no texto, a configuração padrão deve ser usada
    const config = prepareAIResponse('Testing');
    expect(config.language).toBe(DEFAULT_LANGUAGE);
  });
});

describe('Testes de análise de comandos em português', () => {
  test('Deve detectar comando de ajuda', () => {
    const commands = parsePortugueseCommands('preciso de ajuda com minha ficha');
    expect(commands.isHelp).toBe(true);
  });

  test('Deve detectar comando de criação', () => {
    const commands = parsePortugueseCommands('quero criar um novo personagem');
    expect(commands.isCreate).toBe(true);
  });

  test('Deve detectar comando de rolagem de dados', () => {
    const commands = parsePortugueseCommands('rolar 1d20 + 5 para ataque');
    expect(commands.isDiceRoll).toBe(true);
  });

  test('Não deve detectar comando inexistente', () => {
    const commands = parsePortugueseCommands('olá, bom dia');
    expect(commands.isCreate).toBe(false);
    expect(commands.isHelp).toBe(false);
    expect(commands.isDiceRoll).toBe(false);
  });
});
