# Configuração de CI/CD

Este documento descreve como configurar a integração contínua (CI) e entrega contínua (CD) para o projeto Dungeon Keeper.

## GitHub Actions

Para configurar o GitHub Actions, crie um arquivo em `.github/workflows/tests.yml` com o seguinte conteúdo:

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: [3.8, 3.9, '3.10']

    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v2
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest tests/ --cov=src --cov-report=xml
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v2
      with:
        file: ./coverage.xml
        fail_ci_if_error: true
    
    - name: Type check with mypy
      run: |
        mypy src/
    
    - name: Lint with flake8
      run: |
        flake8 src/ tests/
    
    - name: Check formatting with black
      run: |
        black --check src/ tests/
    
    - name: Check imports with isort
      run: |
        isort --check-only src/ tests/
```

## O que este workflow faz?

1. **Testes Automatizados**
   - Executa todos os testes no diretório `tests/`
   - Gera relatório de cobertura de código
   - Envia relatório para o Codecov

2. **Verificação de Tipos**
   - Usa mypy para verificação estática de tipos
   - Garante que todas as anotações de tipo estão corretas

3. **Linting e Formatação**
   - Verifica estilo de código com flake8
   - Garante formatação consistente com black
   - Verifica ordenação de imports com isort

## Como configurar

1. **Habilitar GitHub Actions**
   - Vá para a aba "Actions" no repositório
   - Clique em "I understand my workflows, go ahead and enable them"

2. **Configurar Codecov**
   - Crie uma conta em https://codecov.io
   - Conecte seu repositório do GitHub
   - Adicione o token do Codecov nas secrets do repositório

3. **Badges**
   Adicione estas badges ao README.md:
   ```markdown
   ![Tests](https://github.com/bugijo/dungeon-keeper/workflows/Tests/badge.svg)
   [![codecov](https://codecov.io/gh/bugijo/dungeon-keeper/branch/main/graph/badge.svg)](https://codecov.io/gh/bugijo/dungeon-keeper)
   ```

## Boas Práticas

1. **Commits**
   - Faça commits pequenos e focados
   - Use mensagens de commit descritivas
   - Siga o padrão de commits convencionais

2. **Pull Requests**
   - Crie branches para novas features
   - Faça code review antes de mergear
   - Aguarde todos os checks passarem

3. **Testes**
   - Mantenha cobertura de testes alta
   - Escreva testes para novos features
   - Atualize testes quando mudar código

## Próximos Passos

1. **Deploy Automático**
   - Configurar deploy para ambiente de staging
   - Adicionar testes de integração
   - Implementar deploy para produção

2. **Monitoramento**
   - Adicionar logging
   - Configurar alertas
   - Implementar métricas

3. **Documentação**
   - Gerar documentação automaticamente
   - Publicar em GitHub Pages
   - Manter changelog atualizado