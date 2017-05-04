import express from 'express';
import bodyParser from 'body-parser';
import uuid from 'uuid';

import createStore from 'resolve-es';
import esDriver from 'resolve-es-file';
import createBus from 'resolve-bus';
import busDriver from 'resolve-bus-memory';
import commandHandler from 'resolve-command';
import query from 'resolve-query';

import todoCardAggregate from './aggregates/TodoCard';
import todoItemAggregate from './aggregates/TodoItem';
import cardsProjection from './projections/cards';
import cardDetailsProjectionl from './projections/cardDetails';

const setupMiddlewares = (app) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('views', './views');
    app.set('view engine', 'pug');
};

const app = express();

const eventStore = createStore({
    driver: esDriver({ pathToFile: './storage/eventStore' })
});
const bus = createBus({ driver: busDriver() });
const cardCommandHandler = commandHandler({
    store: eventStore,
    bus,
    aggregate: todoCardAggregate
});
const itemCommandHandler = commandHandler({
    store: eventStore,
    bus,
    aggregate: todoItemAggregate
});

const queries = query({
    store: eventStore,
    bus,
    projections: {
        cards: cardsProjection,
        cardDetails: cardDetailsProjectionl
    }
});

const aggregates = {
    card: cardCommandHandler,
    todo: itemCommandHandler
};

setupMiddlewares(app);

app.get('/', (req, res) =>
    queries('cards').then(inventoryItems =>
        res.render('index', {
            items: Object.values(inventoryItems)
        })
    )
);

app.get('/:card', (req, res) =>
    queries('cardDetails').then(items =>
        res.render('cardDetails', { card: items.cards[req.params.card] })
    )
);

app.post('/command', (req, res) => {
    const command = Object.keys(req.body)
        .filter(key => key !== 'aggregateType' || key !== 'returnUrl')
        .reduce((result, key) => {
            result[key] = req.body[key];
            return result;
        }, {});

    const redirectUrl = req.body.returnUrl || '/';
    const aggregate = aggregates[req.body.aggregateType];

    command.aggregateId = command.aggregateId || uuid.v4();

    aggregate(command)
        .catch((err) => {
            // eslint-disable-next-line no-console
            console.log(err);
        })
        .then(() => res.redirect(redirectUrl));
});

app.listen(3000, () => {
    // eslint-disable-next-line no-console
    console.log('Example app listening on port 3000!');
});
