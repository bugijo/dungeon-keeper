
describe('Fluxo de Criação de Mesas', () => {
  beforeEach(() => {
    // Desativar requests de rede para chamadas não interceptadas
    cy.intercept('*', { statusCode: 404 }).as('ajaxCall');
    
    // Interceptar chamadas específicas ao Supabase e mockear respostas
    cy.intercept('POST', '*supabase.co*/auth/v1/token*', {
      fixture: 'login-response.json',
      statusCode: 200
    }).as('loginRequest');
    
    cy.intercept('GET', '*supabase.co*/rest/v1/profiles*', {
      fixture: 'profile.json',
      statusCode: 200
    }).as('profileRequest');
    
    cy.intercept('GET', '*supabase.co*/rest/v1/tables*', {
      fixture: 'tables.json',
      statusCode: 200
    }).as('tablesRequest');
    
    cy.intercept('POST', '*supabase.co*/rest/v1/tables*', {
      statusCode: 201,
      body: { id: 'mock-table-id' }
    }).as('createTableRequest');
  });

  it('Usuário GM pode criar uma nova mesa', () => {
    // Realizar login como GM
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('gm@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=login-button]').click();
    cy.wait('@loginRequest');
    
    // Navegar para a página de mesas
    cy.visit('/tables');
    cy.wait('@tablesRequest');
    
    // Clicar no botão de criar mesa
    cy.get('[data-cy=create-table-button]').click();
    
    // Preencher formulário de criação de mesa
    cy.get('[data-cy=table-name-input]').type('Aventuras em Neverwinter');
    cy.get('[data-cy=table-system-input]').type('D&D 5e');
    cy.get('[data-cy=max-players-input]').clear().type('5');
    cy.get('[data-cy=table-weekday-input]').select('Sábado');
    cy.get('[data-cy=table-time-input]').type('19:00');
    cy.get('[data-cy=table-synopsis-input]').type('Uma jornada épica pelo mundo de Forgotten Realms');
    
    // Enviar formulário
    cy.get('[data-cy=submit-table-button]').click();
    cy.wait('@createTableRequest');
    
    // Verificar redirecionamento para detalhes da mesa
    cy.url().should('include', '/table/');
    cy.contains('Aventuras em Neverwinter').should('be.visible');
  });

  it('Jogador não aprovado não pode acessar a sessão', () => {
    // Realizar login como jogador comum
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('player@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=login-button]').click();
    cy.wait('@loginRequest');
    
    // Interceptar verificação de participante
    cy.intercept('GET', '*supabase.co*/rest/v1/table_participants*', {
      statusCode: 200,
      body: []
    }).as('participantsCheck');
    
    // Tentar acessar uma sessão sem aprovação
    cy.visit('/table/session/mock-table-id');
    cy.wait('@participantsCheck');
    
    // Verificar redirecionamento para tela de mesas
    cy.url().should('include', '/tables');
    
    // Verificar exibição de mensagem de erro
    cy.contains('Você não é participante desta mesa').should('be.visible');
  });

  it('GM pode aprovar um jogador para participar da mesa', () => {
    // Realizar login como GM
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('gm@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=login-button]').click();
    cy.wait('@loginRequest');
    
    // Interceptar solicitação de participação
    cy.intercept('GET', '*supabase.co*/rest/v1/table_join_requests*', {
      statusCode: 200,
      body: [{
        id: 'request-id-1',
        table_id: 'mock-table-id',
        user_id: 'player-user-id',
        status: 'pending',
        created_at: new Date().toISOString(),
        profiles: {
          display_name: 'Jogador Teste'
        },
        tables: {
          name: 'Mesa de Teste'
        }
      }]
    }).as('joinRequests');
    
    // Interceptar aprovação de solicitação
    cy.intercept('POST', '*supabase.co*/rest/v1/table_participants*', {
      statusCode: 201
    }).as('approveRequest');
    
    cy.intercept('PATCH', '*supabase.co*/rest/v1/table_join_requests*', {
      statusCode: 200
    }).as('updateRequestStatus');
    
    // Navegar para a página de mesas
    cy.visit('/tables');
    cy.wait('@tablesRequest');
    
    // Mudar para a aba de solicitações
    cy.get('[data-cy=requests-tab]').click();
    cy.wait('@joinRequests');
    
    // Aprovar solicitação
    cy.contains('Aprovar').click();
    cy.wait('@approveRequest');
    cy.wait('@updateRequestStatus');
    
    // Verificar sucesso
    cy.contains('Participante aprovado na mesa').should('be.visible');
  });
});
