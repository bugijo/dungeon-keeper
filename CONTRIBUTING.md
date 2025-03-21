# Guia de Contribuição

Obrigado por considerar contribuir com o Dungeon Keeper! Este documento fornece as diretrizes e melhores práticas para contribuir com o projeto.

## Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Padrões de Código](#padrões-de-código)
4. [Processo de Desenvolvimento](#processo-de-desenvolvimento)
5. [Testes](#testes)
6. [Documentação](#documentação)
7. [Revisão de Código](#revisão-de-código)

## Código de Conduta

Este projeto segue um Código de Conduta. Ao participar, você concorda em seguir suas diretrizes.

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

## Como Contribuir

1. **Fork o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/dungeon-keeper.git
   cd dungeon-keeper
   ```

2. **Crie uma Branch**
   ```bash
   git checkout -b feature/nome-da-feature
   # ou
   git checkout -b fix/nome-do-fix
   ```

3. **Faça suas Alterações**
   - Escreva código limpo e bem documentado
   - Adicione testes para novas funcionalidades
   - Atualize a documentação conforme necessário

4. **Commit suas Alterações**
   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   ```

   Padrões de Commit:
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` alterações na documentação
   - `test:` adição ou modificação de testes
   - `refactor:` refatoração de código
   - `style:` formatação, ponto e vírgula, etc
   - `chore:` atualizações de build, dependências, etc

5. **Push para seu Fork**
   ```bash
   git push origin feature/nome-da-feature
   ```

6. **Abra um Pull Request**
   - Use o template fornecido
   - Descreva suas alterações em detalhes
   - Referencie issues relacionadas

## Padrões de Código

### Python

1. **Style Guide**
   - Siga o PEP 8
   - Use type hints
   - Docstrings em todas as funções/classes
   - Nomes descritivos para variáveis/funções

2. **Formatação**
   ```bash
   # Formatar código
   black src/ tests/
   
   # Verificar imports
   isort src/ tests/
   
   # Verificar tipos
   mypy src/
   
   # Lint
   flake8 src/ tests/
   ```

3. **Exemplo de Código**
   ```python
   from typing import List, Optional

   class ExampleClass:
       """
       Exemplo de classe seguindo os padrões do projeto.

       Attributes:
           name: Nome do exemplo
           value: Valor do exemplo
       """
       def __init__(self, name: str, value: int) -> None:
           self.name = name
           self.value = value

       def process_data(self, data: List[int]) -> Optional[int]:
           """
           Processa uma lista de dados.

           Args:
               data: Lista de números para processar

           Returns:
               Resultado do processamento ou None se a lista estiver vazia
           """
           if not data:
               return None
           return sum(data)
   ```

## Processo de Desenvolvimento

1. **Antes de Começar**
   - Verifique issues existentes
   - Discuta grandes mudanças
   - Planeje sua implementação

2. **Durante o Desenvolvimento**
   - Mantenha mudanças focadas
   - Commit frequentemente
   - Mantenha testes passando

3. **Finalizando**
   - Revise seu código
   - Atualize documentação
   - Prepare para review

## Testes

1. **Escrevendo Testes**
   ```python
   import pytest
   from src.example import ExampleClass

   def test_example_process_data():
       example = ExampleClass("test", 1)
       result = example.process_data([1, 2, 3])
       assert result == 6

   def test_example_process_empty_data():
       example = ExampleClass("test", 1)
       result = example.process_data([])
       assert result is None
   ```

2. **Executando Testes**
   ```bash
   # Todos os testes
   pytest

   # Com cobertura
   pytest --cov=src

   # Testes específicos
   pytest tests/test_specific.py
   ```

## Documentação

1. **Docstrings**
   - Use docstrings do Google style
   - Inclua exemplos quando relevante
   - Documente exceções

2. **README e Docs**
   - Mantenha READMEs atualizados
   - Documente novas features
   - Atualize o roadmap

3. **Comentários**
   - Use comentários para explicar "por quê"
   - Mantenha comentários atualizados
   - Evite comentários óbvios

## Revisão de Código

1. **Checklist do Autor**
   - Código segue padrões
   - Testes passando
   - Documentação atualizada
   - Sem código comentado
   - Commits organizados

2. **Checklist do Revisor**
   - Lógica correta
   - Boas práticas seguidas
   - Testes adequados
   - Documentação clara
   - Performance considerada

3. **Feedback**
   - Seja construtivo
   - Explique o porquê
   - Sugira melhorias
   - Elogie boas práticas

## Dúvidas?

Se você tiver dúvidas sobre como contribuir, sinta-se à vontade para:

1. Abrir uma issue
2. Perguntar nas discussões
3. Contatar os mantenedores

Agradecemos sua contribuição! 🎮✨