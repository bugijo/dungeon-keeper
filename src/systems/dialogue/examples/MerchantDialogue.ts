import { DialogueBuilder } from '../DialogueBuilder';

export function createMerchantDialogue() {
  const builder = new DialogueBuilder();

  // Nó inicial
  builder.addNode('greeting', 'Bem-vindo à minha loja! Como posso ajudá-lo hoje?')
    .addOption('greeting', {
      text: 'Gostaria de ver seus itens',
      nextNodeId: 'show_items',
      action: () => console.log('Abrindo inventário do mercador')
    })
    .addOption('greeting', {
      text: 'Quero vender alguns itens',
      nextNodeId: 'sell_items',
      action: () => console.log('Abrindo interface de venda')
    })
    .addOption('greeting', {
      text: 'Conte-me sobre seus produtos',
      nextNodeId: 'about_items'
    })
    .addOption('greeting', {
      text: 'Adeus',
      nextNodeId: 'farewell'
    });

  // Nó de mostrar itens
  builder.addNode('show_items', 'Aqui está meu inventário atual. Veja algo que lhe interesse?')
    .addOption('show_items', {
      text: 'Voltar',
      nextNodeId: 'greeting'
    });

  // Nó de vender itens
  builder.addNode('sell_items', 'O que você gostaria de vender? Pago um preço justo por itens de qualidade.')
    .addOption('sell_items', {
      text: 'Voltar',
      nextNodeId: 'greeting'
    });

  // Nó sobre os itens
  builder.addNode('about_items', 'Tenho os melhores itens da região! Trabalho apenas com artesãos de confiança.')
    .addOption('about_items', {
      text: 'Mostre-me os itens',
      nextNodeId: 'show_items'
    })
    .addOption('about_items', {
      text: 'Voltar',
      nextNodeId: 'greeting'
    });

  // Nó de despedida
  builder.addNode('farewell', 'Volte sempre! Sempre tenho novos itens em estoque.');

  return builder.build('merchant_dialogue');
}