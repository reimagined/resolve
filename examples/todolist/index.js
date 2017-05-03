/* eslint-disable */

import express from 'express';
import bodyParser from 'body-parser';
import pug from 'pug';
import uuid from 'uuid';
import Immutable from 'seamless-immutable';

import createStore from 'resolve-es';
import esDriver from 'resolve-es-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-memory';
import commandHandler from 'resolve-command';
import query from 'resolve-query';

import todoCardAggregate from './aggregates/TodoCard';
import todoItemAggregate from './aggregates/TodoItem';
import cardsReadModel from './read-models/cards';
import cardDetailsReadModel from './read-models/cardDetails';

const setupMiddlewares = (app) => {
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('views', './views')
    app.set('view engine', 'pug');
}

const app = express();

const eventStore = createStore({driver: esDriver({pathToFile: './storage/eventStore' })});
const bus = createBus({ driver: busDriver()});
const cardCommandHandler = commandHandler({ store: eventStore, bus, aggregate: todoCardAggregate });
const itemCommandHandler = commandHandler({ store: eventStore, bus, aggregate: todoItemAggregate });

const queries = query({ store: eventStore, bus, projections: {
    cards: cardsReadModel,
    cardDetails: cardDetailsReadModel
}});

const getCardList = () => queries('cards');
const getCardDetails = () => queries('cardDetails');

const aggregates = {
    card: cardCommandHandler,
    todo: itemCommandHandler
}

setupMiddlewares(app);

app.get('/', function (req, res) {
    return getCardList()
        .then(inventoryItems => res.render('index', {
            items: Object.values(inventoryItems)
        }));
});

app.get('/:card', function (req, res) {
    return getCardDetails()
        .then(items => items.cards[req.params.card])
        .then(card => res.render('cardDetails', { card }));
});

app.post('/command', (req, res) => {
    const command = Object.keys(req.body)
        .filter(key => (key !== 'aggregateType' || key !== 'returnUrl'))
        .reduce((result, key) => {
            result[key] = req.body[key];
            return result;
        }, {});
    const redirectUrl = req.body.returnUrl || '/';

    command.aggregateId = command.aggregateId || uuid.v4();

    aggregates[req.body.aggregateType](command)
        .then(() => res.redirect(redirectUrl))
        .catch((err) => {
            console.log(err);
            res.redirect(redirectUrl)
        });
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
