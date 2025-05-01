
# Guia de Desenvolvimento - Keeper of Realms

Este documento fornece diretrizes e informações importantes para os desenvolvedores que trabalham no projeto Keeper of Realms.

## Estrutura do Projeto

A organização do código segue uma estrutura modular, separando responsabilidades e facilitando a manutenção:

```
src/
├── components/       # Componentes React reutilizáveis
├── pages/           # Páginas e rotas principais 
├── hooks/           # Hooks personalizados
├── contexts/        # Contextos de React para estado global
├── integrations/    # Integrações externas (Supabase, etc.)
├── lib/             # Funções utilitárias
├── constants/       # Constantes e configurações
├── styles/          # Estilos CSS globais e temas
└── types/           # Definições de tipos TypeScript
```

## Padrões de Codificação

### Componentes React

- Use componentes funcionais com hooks
- Siga o padrão de arquivos pequenos e focados
- Extraia lógica complexa para hooks personalizados
- Mantenha os componentes bem tipados com TypeScript

Exemplo de um componente bem estruturado:

```tsx
import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

interface ExampleProps {
  title: string;
  onAction: () => void;
}

export const ExampleComponent: React.FC<ExampleProps> = ({ title, onAction }) => {
  const { user } = useAuth();
  
  return (
    <div className="p-4 bg-fantasy-dark rounded-lg">
      <h2 className="text-xl font-medievalsharp text-white">{title}</h2>
      {user && <Button onClick={onAction}>Ação</Button>}
    </div>
  );
};
```

### Integração com Supabase

- Use o cliente Supabase importado de `@/integrations/supabase/client`
- Implemente tratamento de erros apropriado para chamadas de API
- Verifique sempre a autenticação antes de operações protegidas

```tsx
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const fetchUserData = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error('Erro ao buscar dados do usuário');
    console.error('Erro:', err);
    return null;
  }
};
```

### Estilo e UI

- Use Tailwind CSS para estilos
- Siga o tema medieval/fantasia estabelecido
- Utilize os componentes do Shadcn UI para consistência
- Mantenha a responsividade em mente

```tsx
<div className="fantasy-card p-6 md:p-8 lg:p-10">
  <h3 className="text-fantasy-purple font-medievalsharp text-xl md:text-2xl">
    Título Medieval
  </h3>
  <p className="text-fantasy-stone mt-2">
    Conteúdo com estilo temático.
  </p>
</div>
```

## Fluxo de Trabalho

1. **Desenvolvimento de Novas Funcionalidades**
   - Defina claramente o escopo da funcionalidade
   - Crie os componentes necessários
   - Implemente a lógica de negócios
   - Adicione estilos e testes
   - Refatore para garantir qualidade do código

2. **Correção de Bugs**
   - Identifique a causa raiz
   - Implemente a correção minimizando efeitos colaterais
   - Adicione testes para evitar regressões

3. **Refatoração**
   - Identifique código que pode ser melhorado
   - Extraia componentes e hooks reutilizáveis
   - Melhore o desempenho e a legibilidade

## Ferramentas Recomendadas

- **VSCode** com extensões para React, TypeScript e Tailwind CSS
- **ESLint** para análise de código
- **Prettier** para formatação consistente
- **Chrome DevTools** para depuração

## Recursos de Aprendizado

- [Documentação do React](https://react.dev/)
- [Documentação do TypeScript](https://www.typescriptlang.org/docs/)
- [Documentação do Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Diretrizes para Contribuição

- Escreva código limpo e bem documentado
- Siga as convenções de nomenclatura existentes
- Teste adequadamente as mudanças
- Mantenha as dependências atualizadas
- Considere o desempenho e a acessibilidade

---

Este documento é uma referência viva e será atualizado conforme o projeto evolui.
