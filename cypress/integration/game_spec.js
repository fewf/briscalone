describe('My First Test', function() {
  let p1ws, p2ws, p3ws, p4ws, p5ws;
  it('successfully loads player 1', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(1000)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(1000)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(1000)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.get('h1').should('contain', 'Waiting for more players')
    cy.wait(1000)
  })
  it('successfully loads', function() {
    cy.visit('/') // change URL to match your dev URL
    cy.wait(1000);
    cy.task('handleGamePlayMessage', {messageType: 'bid', message: 9});
  })
})
