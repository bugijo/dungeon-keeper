# Dungeon Keeper

Um jogo de RPG com sistemas modulares e extensíveis para personagens, combate, inventário e magia.

## Sistemas Implementados

### Sistema de Personagens
- Atributos básicos
- Sistema básico de níveis
- Gerenciamento de recursos
- Classes e habilidades (em progresso)

### Sistema de Combate
- Sistema de iniciativa
- Condições e efeitos
- Tipos de dano e resistências
- Sistema de rounds e ações
- Reações e oportunidades

### Sistema de Inventário
- Sistema básico de itens
- Gerenciamento de inventário
- Sistema de equipamentos (em progresso)

### Sistema de Magias
- Sistema básico de magias
- Efeitos e condições
- Sistema de custos (em progresso)

## Estrutura do Projeto

```
src/
  systems/
    character/       # Sistema de personagens
    combat/         # Sistema de combate
    inventory/      # Sistema de inventário
    magic/         # Sistema de magias
```

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/bugijo/dungeon-keeper.git
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Uso

Para implementar um novo sistema:

```bash
python scripts/implement_system.py <nome_do_sistema>
```

Sistemas disponíveis:
- Character
- Combat
- Inventory
- Magic

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Status do Projeto

Veja o arquivo [progress.md](progress.md) para o status detalhado de cada sistema.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.