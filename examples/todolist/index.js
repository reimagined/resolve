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
import cardDetailsProjection from './projections/cardDetails';

const setupMiddlewares = (app) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('views', './views');
    app.set('view engine', 'pug');
};

const app = express();
app.use(express.static('static'));

const eventStore = createStore({
    driver: esDriver({ pathToFile: './event_store.json' })
});
const bus = createBus({ driver: busDriver() });

const execute = commandHandler({
    store: eventStore,
    bus,
    aggregates: [todoCardAggregate, todoItemAggregate]
});

const queries = query({
    store: eventStore,
    bus,
    projections: [cardsProjection, cardDetailsProjection]
});

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

    command.aggregateId = command.aggregateId || uuid.v4();
    command.aggregate = req.body.aggregateType;

    execute(command)
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
