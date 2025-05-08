**Documento de Tarefas e Melhorias para o Dungeon Kreeper**  
*(Versão para Desenvolvimento Interno)*  

---

### **1. Introdução**  
Este documento lista as tarefas prioritárias, correções e melhorias necessárias para o sistema **Dungeon Kreeper**, com foco nas funcionalidades críticas para sessões de RPG. As tarefas são organizadas por módulos e prioridade técnica, considerando a experiência do mestre (DM) e dos jogadores durante o jogo.

---

### **2. Tarefas Prioritárias para o Sistema**  

#### **A. Correções Críticas**  
| **Módulo**       | **Tarefa**                                                                                   | **Status** |  
|-------------------|---------------------------------------------------------------------------------------------|------------|  
| **Navegação**     | Corrigir redirecionamentos quebrados (ex: Biblioteca de NPCs → erro 404).                   | Concluído  |  
| **Combate**       | Implementar cálculo correto de distância no grid (1 quadrado = 5ft).                        | Concluído  |  
| **Sincronização** | Garantir atualização em tempo real do inventário entre jogadores e mestre.                  | Concluído  |  
| **Notificações**  | Implementar sistema de notificações em tempo real para eventos importantes.                  | Concluído  |  

#### **B. Finalização de Funcionalidades**  
| **Módulo**          | **Tarefa**                                                                                   | **Status** |  
|----------------------|---------------------------------------------------------------------------------------------|------------|  
| **Mapa Tático**      | Permitir arrastar tokens e aplicar Fog of War (névoa de guerra) controlável pelo mestre.     | Concluído  |  
| **Inventário**       | Implementar cálculo automático de peso e encumbrance (sobrecarga).                          | Concluído  |  
| **Áudio**            | Implementar sistema de áudio para ambientação com playlists.                                | Concluído  |  
| **Sessões**          | Sistema de agendamento e gerenciamento de sessões.                                          | Concluído  |  
| **Personagens**      | Sistema de criação e compartilhamento de personagens.                                       | Concluído  |  
| **Busca Rápida**     | Implementar sistema de busca rápida para regras e referências.                              | Concluído  |  
| **Chat Avançado**    | Finalizar sistema de chat em tempo real com suporte a rolagens e formatação.                 | Concluído  |  

---

### **3. Melhorias para a Experiência de Jogo**  

#### **A. Interface do Mestre (Durante o Jogo)**  
- **Dashboard de Controle Rápido:**  
  - [x] Adicionar botão de "Rolagem Secreta" (d20 com resultado visível apenas ao mestre).  
  - [x] Implementar barra de busca rápida para regras (ex: "Ataque de Oportunidade").  
  - [x] Criar painel de status dos jogadores com informações básicas.  
  - [x] Implementar painel de status com HP, condições e recursos em tempo real.  
  - [x] Adicionar sistema de lembretes e notas rápidas para o mestre.  

- **Mapa Tático:**  
  - [x] Adicionar ferramentas de medição de área (ex: círculo para magias *Fireball*).  
  - [x] Permitir upload de mapas customizados com grid ajustável (hexagonal/quadrado).  
  - [x] Implementar sistema básico de tokens no mapa.  
  - [x] Aprimorar sistema de Fog of War com controles mais precisos.  
  - [x] Implementar sistema de movimento de personagens no mapa com cálculo de distância.  
  - [x] Adicionar ferramentas de desenho livre para anotações no mapa.  

#### **B. Interface do Jogador (Durante o Jogo)**  
- **Modo de Foco:**  
  - [x] Implementar botão para ocultar UI não essencial (exceto HP e dados críticos).  
  - [x] Adicionar visualização rápida para detalhes de itens/magias sem abrir menus.  
  - [x] Criar modo de visualização compacta para dispositivos móveis.  

- **Ações Rápidas:**  
  - [x] Criar atalho para rolagens contextuais (ex: "Percepção" → rola d20 + modificador).  
  - [x] Implementar sistema básico de inventário.  
  - [x] Vincular inventário a ações rápidas (ex: arrastar item para o avatar → equipar).  
  - [x] Adicionar menu de ações favoritas personalizável pelo jogador.  

---

### **4. Requisitos Técnicos para o Sistema**  

#### **A. Backend**  
| **Tarefa**                                                                 | **Status**    | **Complexidade** |
|----------------------------------------------------------------------------|---------------|------------------|
| Revisar sincronização offline/online para evitar conflitos de dados.        | Concluído     | Alta             |
| Otimizar consultas ao banco de dados para reduzir lag no carregamento.     | Concluído     | Média            |
| Implementar sistema de tempo real para atualizações do mapa tático.        | Concluído     | Alta             |
| Implementar sistema de notificações em tempo real com Supabase Realtime.   | Concluído     | Alta             |

#### **B. Frontend**  
| **Tarefa**                                                                 | **Status**    | **Complexidade** |
|----------------------------------------------------------------------------|---------------|------------------|
| Reduzir tempo de carregamento da ficha de personagem para <1 segundo.      | Concluído     | Alta             |
| Melhorar responsividade da interface para dispositivos móveis.             | Concluído     | Média            |
| Implementar tema visual consistente em todos os componentes.               | Concluído     | Média            |
| Implementar componentes de UI para notificações e alertas.                 | Concluído     | Média            |
| Desenvolver sistema de busca rápida para regras e referências.             | Concluído     | Alta             |

---

### **5. Validação do Sistema**  
#### **Checklist de Testes (Pré-Beta)**  
- **Combate:**  
  - [x] Iniciativa atualizada automaticamente após rolagem.  
  - [x] Modificadores de condições aplicados corretamente (ex: -2 em testes por envenenado).  
  - [x] Sistema básico de combate com turnos implementado.  

- **Inventário:**  
  - [x] Peso total recalcula ao adicionar/remover itens.  
  - [x] Itens equipados alteram atributos do personagem (ex: armadura aumenta CA).  
  - [x] Transferência de itens entre personagens implementada.  

- **Sincronização:**  
  - [x] Alterações no mapa tático visíveis para todos os jogadores.  
  - [x] Alterações no inventário do jogador refletem no dashboard do mestre em <2s.  

---

### **6. Considerações Futuras (Roadmap do Sistema)**  
- **Integrações Avançadas:**  
  - [ ] Suporte a dados físicos Bluetooth (ex: Pixels Dice).  
  - [ ] API para importação/exportação de campanhas em JSON.  
  - [ ] Integração com VTTs populares (Roll20, Foundry).  

- **Otimizações:**  
  - [x] Cache de mapas e recursos para reduzir consumo de memória.  
  - [x] Sistema de *auto-save* contínuo para evitar perda de dados.  
  - [x] Modo offline para jogos sem conexão à internet.  

- **Sistema de Personagens Avançado:**  
  - [ ] Builder de personagens flexível com suporte a diversos sistemas de regras.  
  - [ ] Visualização de personagem com avatares customizáveis e equipamentos visíveis.  
  - [ ] Sistema de progressão com rastreamento de experiência e marcos de personagem.  

- **Sistema de Campanhas e Sessões:**  
  - [ ] Planejador de sessões com agendas detalhadas.  
  - [ ] Registro de sessão com resumos automáticos e manuais.  
  - [ ] Linha do tempo com visualização cronológica de eventos da campanha.  

- **Ferramentas de Narrativa:**  
  - [x] Editor avançado para mestres com suporte a formatação rica.  
  - [x] Sistema de eventos dinâmicos e histórias não lineares.  
  - [ ] Geração de conteúdo assistida por IA (NPCs, missões, diálogos).  

- **Melhorias no Sistema de Fog of War:**  
  - [x] Implementar sistema de linha de visão (Line of Sight) baseado em obstáculos.  
  - [x] Adicionar suporte para áreas de visão dinâmicas baseadas em fontes de luz.  
  - [x] Criar sistema de memória de áreas reveladas (áreas já vistas ficam semi-transparentes).  
  - [x] Implementar sistema de visão por personagem (cada jogador vê apenas o que seu personagem veria).  

---

### **7. Conclusão e Próximos Passos**  
Este documento deve ser usado como guia para priorizar tarefas de desenvolvimento. Com base no progresso atual, recomenda-se:  

1. **Finalizar melhorias avançadas no sistema de Fog of War:**  
   - ✅ Sistema de linha de visão (Line of Sight) baseado em obstáculos implementado.  
   - ✅ Suporte para áreas de visão dinâmicas baseadas em fontes de luz implementado.  
   - ✅ Sistema de memória de áreas reveladas implementado.  
   - ✅ Sistema de visão por personagem implementado.  

2. **Focar nas otimizações de performance:**  
   - ✅ Implementar cache de mapas e recursos para reduzir consumo de memória.  
   - ✅ Desenvolver sistema de auto-save contínuo para evitar perda de dados.  
   - ✅ Otimizar renderização do mapa tático para dispositivos de menor desempenho.  

3. **Expandir ferramentas de narrativa:**  
   - ✅ Desenvolver editor avançado para mestres com suporte a formatação rica.  
   - ✅ Implementar sistema de eventos dinâmicos e histórias não lineares.  
   - ⏳ Explorar integração com ferramentas de IA para geração de conteúdo.  

4. **Validar a experiência do usuário:**  
   - Realizar testes de usabilidade com grupos de jogadores reais.  
   - Coletar feedback sobre o sistema de Fog of War e iluminação dinâmica.  
   - Identificar pontos de atrito na interface e fluxo de jogo.  

**Nota:** Aproximadamente 95% das funcionalidades planejadas já foram implementadas com sucesso, incluindo todas as funcionalidades críticas, melhorias no sistema de Fog of War e iluminação dinâmica, otimizações de performance e ferramentas avançadas de narrativa. O foco agora deve ser na integração com ferramentas de IA para geração de conteúdo e validação da experiência do usuário para elevar ainda mais a experiência de jogo.  

--- 

**Versão do Documento:** 2.0  
**Última Atualização:** 2024-09-17  
**Responsável:** Equipe Dungeon Kreeper
