describe('Briscalone Game', function() {
  it('initializes player 1', function() {
    cy.visit('/')
    cy.get('h1').should('contain', "Who are you?");
    cy.get('input').type('Greg{enter}');
    cy.get('h1').should('contain', 'waiting for more players')
    cy.wait(200)
  })
  it('initializes player 2', function() {
    cy.visit('/')
    cy.get('h1').should('contain', "Who are you?");
    cy.get('input').type('Rachael{enter}');
    cy.get('h1').should('contain', 'waiting for more players')
    cy.wait(200)
  })
  it('initializes player 3', function() {
    cy.visit('/')
    cy.get('h1').should('contain', "Who are you?");
    cy.get('input').type('Emily{enter}');
    cy.get('h1').should('contain', 'waiting for more players')
    cy.wait(200)
  })
  it('initializes player 4', function() {
    cy.visit('/')
    cy.get('h1').should('contain', "Who are you?");
    cy.get('input').type('Ryan{enter}');
    cy.get('h1').should('contain', 'waiting for more players')
    cy.wait(200)
  })
  it('initializes player 5', function() {

    cy.visit('/')
    cy.get('h1').should('contain', "Who are you?");
    cy.get('input').type('Nathan{enter}');
    cy.wait(500);
  });
  it('accepts bids', function() {
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
  });
  it('accepts throws', function() {
    cy.request('POST', '/test/', {messageType: 'throw', message: 4});
    cy.request('POST', '/test/', {messageType: 'throw', message: 30});
    cy.request('POST', '/test/', {messageType: 'throw', message: 22});
    cy.request('POST', '/test/', {messageType: 'throw', message: 10});
    // plays 17 / King of Spades
    cy.get('.handCard > img[alt="king of spades"').click();
    // picks diamond
    cy.get('.suitButton:first').click();
    // player 1 wins trick
    cy.request('POST', '/test/', {messageType: 'throw', message: 5});
    cy.request('POST', '/test/', {messageType: 'throw', message: 29});
    cy.request('POST', '/test/', {messageType: 'throw', message: 37});
    cy.request('POST', '/test/', {messageType: 'throw', message: 15});
    // plays 2 / 4 of Diamonds
    cy.get('.handCard > img[alt="4 of diamonds"').click();
    // player 1 wins trick
    cy.request('POST', '/test/', {messageType: 'throw', message: 20});
    cy.request('POST', '/test/', {messageType: 'throw', message: 27});
    cy.request('POST', '/test/', {messageType: 'throw', message: 35});
    cy.request('POST', '/test/', {messageType: 'throw', message: 0});
    // plays 39 / A of  clubs
    cy.get('.handCard > img[alt="ace of clubs"').click();
    // player 4 wins trick
    cy.request('POST', '/test/', {messageType: 'throw', message: 14});
    // plays 3 / 5D
    cy.get('.handCard > img[alt="5 of diamonds"').click();
    cy.request('POST', '/test/', {messageType: 'throw', message: 21});
    cy.request('POST', '/test/', {messageType: 'throw', message: 31});
    cy.request('POST', '/test/', {messageType: 'throw', message: 23});
    // player 5 wins trick
    // plays 4 / 6D
    cy.get('.handCard > img[alt="10 of hearts"').click();
    cy.request('POST', '/test/', {messageType: 'throw', message: 6});
    cy.request('POST', '/test/', {messageType: 'throw', message: 26});
    cy.request('POST', '/test/', {messageType: 'throw', message: 36});
    cy.request('POST', '/test/', {messageType: 'throw', message: 13});
    // player 1 wins trick
    cy.request('POST', '/test/', {messageType: 'throw', message: 16});
    cy.request('POST', '/test/', {messageType: 'throw', message: 32});
    cy.request('POST', '/test/', {messageType: 'throw', message: 38});
    cy.request('POST', '/test/', {messageType: 'throw', message: 11});
    // plays 7 / KD
    cy.get('.handCard > img[alt="king of diamonds"').click();
    // player 5 wins trick
    // plays 8 / 10D
    cy.get('.handCard > img[alt="10 of diamonds"').click();
    cy.request('POST', '/test/', {messageType: 'throw', message: 18});
    cy.request('POST', '/test/', {messageType: 'throw', message: 33});
    cy.request('POST', '/test/', {messageType: 'throw', message: 25});
    cy.request('POST', '/test/', {messageType: 'throw', message: 12});
    // player 5 wins trick
    // plays 9 / AD
    cy.get('.handCard > img[alt="ace of diamonds"').click();
    cy.request('POST', '/test/', {messageType: 'throw', message: 19});
    cy.request('POST', '/test/', {messageType: 'throw', message: 34});
    cy.request('POST', '/test/', {messageType: 'throw', message: 24});
    cy.request('POST', '/test/', {messageType: 'throw', message: 1});
  })
})
