import express from 'express';
import bodyParser from 'body-parser';
import uuid from 'uuid';

import createEventStore from 'resolve-es';
import createStorage from 'resolve-storage';
import storageDriver from 'resolve-storage-file';
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

const storage = createStorage({
    driver: storageDriver({ pathToFile: './event_store.json' })
});
const bus = createBus({ driver: busDriver() });

const eventStore = createEventStore({
    storage,
    bus
});

const execute = commandHandler({
    eventStore,
    aggregates: [todoCardAggregate, todoItemAggregate]
});

const queries = query({
    eventStore,
    projections: [cardsProjection, cardDetailsProjection]
});

setupMiddlewares(app);

app.get('/', (req, res) => {
    const inventoryItems = queries('cards');
    res.render('index', { items: Object.values(inventoryItems) });
});

app.get('/:card', (req, res) => {
    const items = queries('cardDetails');
    res.render('cardDetails', { card: items.cards[req.params.card] });
});

app.post('/command', (req, res) => {
    const command = Object.keys(req.body)
        .filter(key => key !== 'aggregateName' || key !== 'returnUrl')
        .reduce((result, key) => {
            result[key] = req.body[key];
            return result;
        }, {});

    const redirectUrl = req.body.returnUrl || '/';

    command.aggregateId = command.aggregateId || uuid.v4();
    command.aggregateName = req.body.aggregateName;

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
