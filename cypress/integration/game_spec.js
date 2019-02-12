describe('My First Test', function() {
  let p1ws, p2ws, p3ws, p4ws, p5ws;
  it('successfully loads player 1', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(200)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(200)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(200)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(200)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.wait(500);
    cy.request('POST', '/test/', {messageType: 'bid', message: 9});
    cy.request('POST', '/test/', {messageType: 'bid', message: 8});
    cy.request('POST', '/test/', {messageType: 'bid', message: 7});
    cy.request('POST', '/test/', {messageType: 'bid', message: 6});
    cy.get('button:contains("2")').click();
    cy.wait(500);
    cy.request('POST', '/test/', {messageType: 'bid', message: 'Y'});
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.get('button:contains("2 and 65 points")').click();
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.request('POST', '/test/', {messageType: 'bid', message: 'P'});
    cy.request('POST', '/test/', {messageType: 'throw', message: 16});
    cy.request('POST', '/test/', {messageType: 'throw', message: 30});
    cy.request('POST', '/test/', {messageType: 'throw', message: 22});
    cy.request('POST', '/test/', {messageType: 'throw', message: 11});
    cy.get('.handCard:eq(5)').click();

  })
})
