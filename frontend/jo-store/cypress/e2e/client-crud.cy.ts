describe('CRUD de clientes', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
    cy.reload()
  })

  function openRegistration() {
    cy.get('[data-cy="header-profile"]').click()
    cy.contains('h1', 'Entrar na sua conta').should('be.visible')
    cy.get('[data-cy="login-create-account"]').click()
    cy.contains('h1', 'Cadastrar perfil').should('be.visible')
  }

  function fillRequiredRegistration(password = 'Senha@123', advanceToAddress = true) {
    cy.get('[data-cy="client-full-name"]').type('Ana Cliente da Silva')
    cy.get('[data-cy="client-cpf"]').type('12345678901')
    cy.get('[data-cy="client-birth-date"]').type('1999-03-15')
    cy.get('[data-cy="client-gender"]').select('Feminino')
    cy.get('[data-cy="client-phone-type"]').select('Celular')
    cy.get('[data-cy="client-phone-ddd"]').type('11')
    cy.get('[data-cy="client-phone-number"]').type('999999999')
    cy.get('[data-cy="client-registration-next"]').click()
    cy.get('[data-cy="client-email"]').type('ana@example.com')
    cy.get('[data-cy="client-password"]').type(password)
    cy.get('[data-cy="client-confirm-password"]').type(password)
    cy.get('[data-cy="client-registration-next"]').click()
    if (!advanceToAddress) return
    cy.get('[data-cy="client-address-label"]').clear().type('Casa')
    cy.get('[data-cy="client-address-residence-type"]').select('Casa')
    cy.get('[data-cy="client-address-street-type"]').select('Rua')
    cy.get('[data-cy="client-address-street"]').type('das Flores')
    cy.get('[data-cy="client-address-number"]').type('100')
    cy.get('[data-cy="client-address-neighborhood"]').type('Centro')
    cy.get('[data-cy="client-address-zip-code"]').type('01001000')
    cy.get('[data-cy="client-address-city"]').type('São Paulo')
    cy.get('[data-cy="client-address-state"]').type('SP')
    cy.get('[data-cy="client-address-country"]').type('Brasil')
    cy.get('[data-cy^="client-address-role-"]').check()
  }

  it('RNF0031/RNF0032 - impede cadastro com senha fora da política', () => {
    openRegistration()
    fillRequiredRegistration('fraca', false)
    cy.contains('A senha deve ter ao menos 8 caracteres').should('be.visible')
  })

  it('RF0021, RF0022, RF0024 e RF0023 - cadastra, altera, consulta e inativa um cliente', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.contains('Código do cliente: CLI-000001').should('be.visible')

    cy.contains('button', 'Alterar informações').click()

    cy.contains('h2', 'Dados pessoais')
      .closest('section')
      .within(() => {
        cy.contains('label', 'Nome completo')
          .find('input')
          .clear()
          .type('Ana Cliente Atualizada')

        cy.contains('button', 'Salvar dados pessoais').click()
      })

    cy.get('[data-cy="header-admin"]').click()
    cy.contains('label', 'Nome').find('input').type('Atualizada')
    cy.contains('button', 'Consultar').click()
    cy.contains('Ana Cliente Atualizada').should('be.visible')
    cy.contains('button', 'Inativar cliente').click()
    cy.contains('INATIVO').should('be.visible')
  })

  it('RF0028, RNF0031 e RNF0032 - altera a senha e valida senha atual, força e confirmação', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()

    cy.get('.profile-account-navigation').contains('button', 'Alterar senha').click()

    cy.contains('h2', 'Alterar senha')
      .closest('section')
      .within(() => {
        cy.contains('label', 'Senha atual').find('input').type('Incorreta@123')
        cy.contains('label', 'Nova senha').find('input').type('NovaSenha@123')
        cy.contains('label', 'Confirmar nova senha').find('input').type('NovaSenha@123')
        cy.contains('button', 'Alterar senha').click()
      })
    cy.contains(/senha atual informada/i).should('be.visible')

    cy.contains('h2', 'Alterar senha').closest('section').within(() => {
      cy.contains('label', 'Senha atual').find('input').clear().type('Senha@123')
      cy.contains('label', 'Confirmar nova senha').find('input').clear().type('Diferente@123')
      cy.contains('button', 'Alterar senha').click()
    })
    cy.contains(/confirma.*iguais/i).should('be.visible')

    cy.contains('h2', 'Alterar senha').closest('section').within(() => {
      cy.contains('label', 'Nova senha').find('input').clear().type('fraca')
      cy.contains('label', 'Confirmar nova senha').find('input').clear().type('fraca')
      cy.contains('button', 'Alterar senha').click()
    })
    cy.contains(/senha deve ter ao menos 8 caracteres/i).should('be.visible')

    cy.contains('h2', 'Alterar senha').closest('section').within(() => {
      cy.contains('label', 'Nova senha').find('input').clear().type('NovaSenha@123')
      cy.contains('label', 'Confirmar nova senha').find('input').clear().type('NovaSenha@123')
      cy.contains('button', 'Alterar senha').click()
    })
    cy.contains('Sua senha foi alterada com segurança.').should('be.visible')
  })

  it('RF0026, RN0021, RN0022 e RN0023 - mantém os endereços obrigatórios e permite gerenciá-los separadamente', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.get('.profile-account-navigation').contains('button', 'Meus endereços').click()

    cy.contains('h2', 'Meus endereços').closest('section').within(() => {
      cy.get('[data-cy="open-address-form"]').click()
      cy.contains('label', 'Tipo de residência').find('select').select('Apartamento')
      cy.contains('label', 'Tipo de logradouro').find('select').select('Avenida')
      cy.contains('label', 'Logradouro').find('input').type('Paulista')
      cy.contains('label', 'Número').find('input').type('200')
      cy.contains('label', 'Bairro').find('input').type('Bela Vista')
      cy.contains('label', 'CEP').find('input').type('01310100')
      cy.contains('label', 'Cidade').find('input').type('São Paulo')
      cy.contains('label', 'Estado').find('input').type('SP')
      cy.contains('label', 'País').find('input').clear().type('Brasil')
      cy.contains('button', 'Adicionar endereço').click()
    })
    cy.contains(/endereço de entrega precisa ter um nome curto/i).should('be.visible')

    cy.contains('h2', 'Meus endereços').closest('section').within(() => {
      cy.contains('label', 'Apelido').find('input').type('Trabalho')
      cy.contains('button', 'Adicionar endereço').click()
    })
    cy.contains('Trabalho').should('be.visible')

    cy.get('.profile-management-item').last().within(() => {
      cy.contains('button', 'Editar').click()
    })
    cy.contains('h2', 'Meus endereços').closest('section').within(() => {
      cy.contains('label', 'Número').find('input').clear().type('201')
      cy.contains('button', 'Salvar alterações').click()
    })
    cy.contains('201').should('be.visible')

    cy.get('.profile-management-item').first().within(() => {
      cy.contains('button', 'Remover').click()
    })
    cy.contains(/precisa manter ao menos um endereço residencial/i).should('be.visible')
  })

  it('RF0027, RN0024 e RN0025 - gerencia cartões, dados obrigatórios e cartão preferencial', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.get('.profile-account-navigation').contains('button', 'Meus cartões').click()

    cy.contains('h2', 'Meus cartões').closest('section').within(() => {
      cy.contains('Não existem cartões cadastrados.').should('be.visible')
      cy.get('[data-cy="open-card-form"]').click()
      cy.contains('label', 'Bandeira').find('select').find('option').should('have.length', 4)
      cy.contains('label', 'Bandeira').find('select').should('contain', 'Visa').and('contain', 'Mastercard').and('contain', 'Elo').and('contain', 'American Express')

      cy.contains('label', 'Titular').find('input').type('Ana Cliente da Silva')
      cy.contains('label', 'Número').find('input').type('123456789012')
      cy.contains('label', 'CVV').find('input').type('123')
      cy.contains('button', 'Adicionar cartão').click()
    })
    cy.contains(/número de cartão válido, com 13 a 19 dígitos/i).should('be.visible')

    cy.contains('h2', 'Meus cartões').closest('section').within(() => {
      cy.contains('label', 'Número').find('input').clear().type('4111111111111111')
      cy.contains('button', 'Adicionar cartão').click()
    })
    cy.contains('1111').should('be.visible')
    cy.contains('Cartão preferencial').should('be.visible')

    cy.contains('h2', 'Meus cartões').closest('section').within(() => {
      cy.get('[data-cy="open-card-form"]').click()
      cy.contains('label', 'Titular').find('input').type('Ana Cliente da Silva')
      cy.contains('label', 'Número').find('input').type('5555555555554444')
      cy.contains('label', 'Bandeira').find('select').select('Mastercard')
      cy.contains('label', 'CVV').find('input').type('456')
      cy.contains('button', 'Adicionar cartão').click()
    })
    cy.contains('4444').should('be.visible')

    cy.contains('h2', 'Meus cartões').closest('section').within(() => {
      cy.get('.profile-management-item').last().within(() => {
        cy.contains('button', 'Tornar preferencial').click()
        cy.contains('Cartão preferencial').should('be.visible')
      })

      cy.get('.profile-management-item').first().within(() => {
        cy.contains('button', 'Remover').click()
      })
    })
    cy.contains('4111').should('not.exist')
  })

  it('RN0026 - exige os campos obrigatórios do cadastro de cliente', () => {
    openRegistration()
    cy.get('[data-cy="client-registration-next"]').click()
    cy.contains('Preencha o nome completo.').should('be.visible')
  })

  it('RF0024 - consulta clientes por CPF, e-mail, status e retorno vazio', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.get('[data-cy="header-admin"]').click()

    cy.contains('label', 'CPF').find('input').type('12345678901')
    cy.contains('button', 'Consultar').click()
    cy.contains('Ana Cliente da Silva').should('be.visible')

    cy.contains('button', 'Limpar').click()
    cy.contains('label', 'E-mail').find('input').type('ana@example.com')
    cy.contains('button', 'Consultar').click()
    cy.contains('Ana Cliente da Silva').should('be.visible')

    cy.contains('button', 'Limpar').click()
    cy.contains('label', 'Status').find('select').select('ATIVO')
    cy.contains('button', 'Consultar').click()
    cy.contains('ATIVO').should('be.visible')

    cy.contains('button', 'Inativar cliente').click()
    cy.contains('button', 'Limpar').click()
    cy.contains('label', 'Status').find('select').select('INATIVO')
    cy.contains('button', 'Consultar').click()
    cy.contains('INATIVO').should('be.visible')

    cy.contains('button', 'Limpar').click()
    cy.contains('label', 'Nome').find('input').type('Cliente inexistente')
    cy.contains('button', 'Consultar').click()
    cy.contains('Nenhum cliente cadastrado').should('be.visible')
  })

  it('RNF0035 - rejeita CPF/e-mail duplicados e gera código único para outro cliente', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.contains('Código do cliente: CLI-000001').should('be.visible')

    cy.get('.profile-account-navigation').contains('button', 'Sair').click()
    cy.get('[data-cy="login-create-account"]').click()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.contains('Já existe um cliente cadastrado com este CPF.').should('be.visible')

    cy.contains('button', 'Voltar').click()
    cy.contains('button', 'Voltar').click()
    cy.get('[data-cy="client-cpf"]').clear().type('98765432100')
    cy.get('[data-cy="client-registration-next"]').click()
    cy.get('[data-cy="client-registration-next"]').click()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.contains('Já existe um cliente cadastrado com este e-mail.').should('be.visible')

    cy.contains('button', 'Voltar').click()
    cy.get('[data-cy="client-email"]').clear().type('ana.segunda@example.com')
    cy.get('[data-cy="client-registration-next"]').click()
    cy.get('[data-cy="client-register-submit"]').click()
    cy.contains('Código do cliente: CLI-000002').should('be.visible')
  })

  it('permite entrar com credenciais de um cliente cadastrado', () => {
    openRegistration()
    fillRequiredRegistration()
    cy.get('[data-cy="client-register-submit"]').click()

    cy.get('.profile-account-navigation').contains('button', 'Sair').click()
    cy.contains('h1', 'Entrar na sua conta').should('be.visible')
    cy.get('[data-cy="login-email"]').type('ana@example.com')
    cy.get('[data-cy="login-password"]').type('Senha@123')
    cy.get('[data-cy="login-submit"]').click()

    cy.get('.profile-account-navigation').contains('button', 'Sair').should('be.visible')
  })
})
