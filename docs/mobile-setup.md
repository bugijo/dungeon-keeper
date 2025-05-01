
# Configuração Mobile - Keeper of Realms Forge

Este documento descreve como configurar e executar o aplicativo em dispositivos Android e iOS.

## Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Android Studio (para desenvolvimento Android)
- Xcode (para desenvolvimento iOS, apenas macOS)
- Um dispositivo físico Android/iOS ou emulador

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/bugijo/keeper-of-realms-forge-aa8e1d58.git
cd keeper-of-realms-forge-aa8e1d58
```

2. Instale as dependências:
```bash
npm install
```

3. Instale as capacidades nativas:
```bash
npx cap add android
npx cap add ios
```

## Desenvolvimento

### Executando no Navegador (Modo de Desenvolvimento)

```bash
npm run dev
```

### Preparando Build para Dispositivos

```bash
npm run build
npx cap sync
```

### Executando em Dispositivo Android

```bash
npx cap open android
# ou para executar diretamente:
npx cap run android
```

### Executando em Dispositivo iOS

```bash
npx cap open ios
# ou para executar diretamente:
npx cap run ios
```

## Recursos de Gestos e Animações

O aplicativo utiliza gestos nativos e animações para melhorar a experiência do usuário:

- Deslize para a esquerda/direita para navegação entre abas
- Toque e pressione para interações com itens
- Animações de transição entre telas

## Temas e Estilo

O aplicativo usa um tema medieval de RPG com:

- Cores específicas do dungeon (roxo, dourado, vermelho)
- Bordas brilhantes nos cartões
- Botões com efeitos de pressão
- Fontes medievais (MedievalSharp)

## Solução de Problemas

Se encontrar erros durante a execução em dispositivos:

1. Verifique se o ambiente está configurado corretamente
2. Execute `npx cap doctor` para diagnosticar problemas
3. Verifique logs detalhados com `npx cap logs android` ou `npx cap logs ios`

## Notas Adicionais

- Os efeitos sonoros são carregados sob demanda para reduzir o tamanho inicial do app
- As animações podem ser desativadas nas configurações de acessibilidade
