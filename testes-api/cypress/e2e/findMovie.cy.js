import { faker } from "@faker-js/faker"

describe('Consulta detalhada de filmes', function () {
    let movieId;
    let titleMovie;
    let genreMovie;
    let descriptionMovie;
    let durationInMinutes;
    let releaseYear;
    let usuarioCriado;
    let token;

    before(function () {
        cy.adminCreatesAMovie(faker.person.firstName() + 'âo O Filme', 'Ação', 'Não tenho nada...', 180, 2024).then(function (response) {
            movieId = response.body.id
            titleMovie = response.body.title
            descriptionMovie = response.body.description
            genreMovie = response.body.genre
            durationInMinutes = response.body.durationInMinutes
            releaseYear = response.body.releaseYear
        });
    });

    describe('Usuário comum', function () {

        before(function () {
            cy.createUser('jacaré', faker.internet.exampleEmail(), '123456').then(function (response) {
                usuarioCriado = response.body
            }).then(function () {
                cy.login(usuarioCriado.email, '123456').then(function (response) {
                    token = response.body.accessToken;
                    cy.postReview(movieId, token)
                });
            });
        });

        after(function () {
            cy.promoteAdmin(token).then(function () {
                cy.deleteUser(usuarioCriado.id, token)
            });
        });

        it('Deve ser possível encontrar um filme por id como usuário comum', function () {
            cy.request({
                method: 'GET',
                url: 'movies/' + movieId,
                auth: {
                    bearer: token,
                },
            }).then(function (response) {
                expect(response.status).to.equal(200);
                expect(response.body).to.deep.include({
                    "id": movieId,
                    "title": titleMovie,
                    "description": descriptionMovie,
                    "genre": genreMovie,
                    "durationInMinutes": durationInMinutes,
                    "releaseYear": releaseYear,
                    "criticScore": 0,
                    "audienceScore": 5,

                });
                expect(response.body.reviews[0]).to.deep.include(
                    {
                        reviewText: "Teste review usuário inativado / promovido",
                        reviewType: 0,
                        score: 5,
                        user: {
                            id: usuarioCriado.id,
                            name: usuarioCriado.name,
                            type: 0
                        }
                    }
                )
                expect(response.body.reviews[0].id).to.be.an('number')
                expect(response.body.reviews[0].updatedAt).to.be.an('string')
            });
        });
    });

    describe('Usuário critico', function () {

        before(function () {
            cy.createUser('jacaré', faker.internet.exampleEmail(), '123456').then(function (response) {
                usuarioCriado = response.body
            }).then(function () {
                cy.login(usuarioCriado.email, '123456').then(function (response) {
                    token = response.body.accessToken;
                }).then(function () {
                    cy.promoteCritic(token).then(function () {
                        cy.postReview(movieId, token)
                    });
                });
            });
        });

        after(function () {
            cy.promoteAdmin(token).then(function () {
                cy.deleteUser(usuarioCriado.id, token)
            });
        });

        it('Deve ser possível encontrar um filme por id como usuário critico', function () {
            cy.request({
                method: 'GET',
                url: 'movies/' + movieId,
                auth: {
                    bearer: token,
                },
            }).then(function (response) {
                expect(response.status).to.equal(200);
                expect(response.body).to.deep.include({
                    "id": movieId,
                    "title": titleMovie,
                    "description": descriptionMovie,
                    "genre": genreMovie,
                    "durationInMinutes": durationInMinutes,
                    "releaseYear": releaseYear,
                    "criticScore": 5,
                    "audienceScore": 0,
                });
                expect(response.body.reviews[0]).to.deep.include(
                    {
                        reviewText: "Teste review usuário inativado / promovido",
                        reviewType: 1,
                        score: 5,
                        user: {
                            id: usuarioCriado.id,
                            name: usuarioCriado.name,
                            type: 2
                        }
                    }
                )
                expect(response.body.reviews[0].id).to.be.an('number')
                expect(response.body.reviews[0].updatedAt).to.be.an('string')
            });
        });
    });

    describe('Usuário admin', function () {
        before(function () {
            cy.createUser('jacaré', faker.internet.exampleEmail(), '123456').then(function (response) {
                usuarioCriado = response.body
            }).then(function () {
                cy.login(usuarioCriado.email, '123456').then(function (response) {
                    token = response.body.accessToken;
                }).then(function () {
                    cy.promoteAdmin(token).then(function () {
                        cy.postReview(movieId, token)
                    });
                });
            });
        });

        after(function () {
            cy.deleteUser(usuarioCriado.id, token)
        });

        it('Deve ser possível encontrar um filme por id como usuário admin', function () {
            cy.request({
                method: 'GET',
                url: 'movies/' + movieId,
                auth: {
                    bearer: token,
                },
            }).then(function (response) {
                expect(response.status).to.equal(200);
                expect(response.body).to.deep.equal({
                    "id": movieId,
                    "title": titleMovie,
                    "description": descriptionMovie,
                    "genre": genreMovie,
                    "durationInMinutes": durationInMinutes,
                    "releaseYear": releaseYear,
                    "criticScore": response.body.criticScore,
                    "audienceScore": response.body.audienceScore,
                    "reviews": response.body.reviews
                });
            });
        });
    });

    describe('Usuário não logado', function () {
        before(function () {
            cy.createUser('jacaré', faker.internet.exampleEmail(), '123456').then(function (response) {
                usuarioCriado = response.body
            }).then(function () {
                cy.login(usuarioCriado.email, '123456').then(function (response) {
                    token = response.body.accessToken;
                    cy.postReview(movieId, token)
                });
            });
        });

        it('Deve ser possível encontrar um filme por id como usuário não logado', function () {
            cy.request({
                method: 'GET',
                url: 'movies/' + movieId,
            }).then(function (response) {
                expect(response.status).to.equal(200);
                expect(response.body).to.deep.equal({
                    "id": movieId,
                    "title": titleMovie,
                    "description": descriptionMovie,
                    "genre": genreMovie,
                    "durationInMinutes": durationInMinutes,
                    "releaseYear": releaseYear,
                    "criticScore": response.body.criticScore,
                    "audienceScore": response.body.audienceScore,
                    "reviews": response.body.reviews
                });
            });
        });

        it('Não deve ser possível encontrar um filme com um id inválido', function () {
            let idInvalidosss = ['3.0', '3.5', '2.0', '4.2']
            idInvalidosss.forEach(function (idInvalidosss) {
                cy.request({
                    method: 'GET',
                    url: 'movies/' + idInvalidosss,
                    failOnStatusCode: false
                }).then(function (response) {
                    expect(response.status).to.equal(400);
                    expect(response.body).to.deep.equal({
                        "message": "Validation failed (numeric string is expected)",
                        "error": "Bad Request",
                        "statusCode": 400
                    });
                });
            });
        });
    });
});