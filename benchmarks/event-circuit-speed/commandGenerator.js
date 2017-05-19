import { rpoisson } from 'randgen';
import uuid from 'uuid';

import memoryDriver from 'resolve-bus-memory';
import createBus from 'resolve-bus';
import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';
import createCommandExecutor from 'resolve-command';

import config from './config';

const createEvent = (type, args) => ({ ...args, type });
const orgUnitTypes = ['AAA', 'BBB', 'CCC', 'DDD'];
const timePeriods = ['2016.1', '2016.2', '2016.3', '2016.4'];

const store = createEs({ driver: mongoDbDriver({
    url: config.MONGODB_CONNECTION_URL,
    collection: config.MONGODB_COLLECTION_NAME
}) });

const bus = createBus({ driver: memoryDriver() });

const aggregates = [
    {
        name: 'objective',
        commands: {
            create: (state, args) => createEvent('ObjectiveCreated', args),
            changeTitle: (state, args) => createEvent('ObjectiveTitleChanged', args),
            changeTimePeriod: (state, args) => createEvent('ObjectivePeriodChanged', args),
            delete: (state, args) => createEvent('ObjectiveDeleted', args),
            addKeyResult: (state, args) => {
                const event = createEvent('KeyResultAdded', args);
                event.payload.keyResultId = event.payload.keyResultId || uuid.v4();
                return event;
            },
            updateKeyResult: (state, args) => createEvent('KeyResultUpdated', args),
            deleteKeyResult: (state, args) => createEvent('KeyResultDeleted', args)
        },
        handlers: {}
    },
    {
        name: 'user',
        commands: {
            create: (state, args) => createEvent('UserCreated', args),
            delete: (state, args) => createEvent('UserDeleted', args)
        },
        handlers: {}
    },
    {
        name: 'orgUnit',
        commands: {
            create: (state, args) => createEvent('OrgUnitCreated', args),
            rename: (state, args) => createEvent('OrgUnitRenamed', args),
            changeType: (state, args) => createEvent('OrgUnitChangedType', args),
            delete: (state, args) => createEvent('OrgUnitDeleted', args),
            addOrgUnit: (state, args) => createEvent('OrgUnitAddedToOrgUnit', args),
            addUser: (state, args) => createEvent('UserAddedToOrgUnit', args),
            removeUser: (state, args) => createEvent('UserRemovedFromOrgUnit', args),
            moveUser: (state, args) => createEvent('UserMoved', args),
            removeOrgUnit: (state, args) => createEvent('OrgUnitRemovedFromOrgUnit', args),
            moveOrgUnit: (state, args) => createEvent('OrgUnitMoved', args)
        },
        handlers: {}
    }
];

const commandExecute = createCommandExecutor({ store, bus, aggregates });

function executeCommandByType(command, state) {
    const [aggregateName, type] = command.split(/\//);
    switch (command) {
        case 'user/create': {
            const userId = uuid.v4();
            state.users.push(userId);

            return commandExecute({
                aggregateId: userId,
                aggregateName,
                type,
                payload: {
                    displayName: uuid.v4(),
                    email: `${uuid.v4()}@${uuid.v4()}.com`
                }
            });
        }

        case 'user/delete': {
            if (state.users.length < 1) return Promise.resolve();

            const userId = state.users.shift();

            return commandExecute({
                aggregateId: userId,
                aggregateName,
                type
            });
        }

        case 'orgUnit/create': {
            const orgUnitId = uuid.v4();
            state.orgUnits.push(orgUnitId);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4(),
                    type: orgUnitTypes[Math.floor(Math.random() * orgUnitTypes.length)]
                }
            });
        }

        case 'orgUnit/rename': {
            if (state.orgUnits.length < 1) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            state.orgUnits.push(orgUnitId);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4()
                }
            });
        }

        case 'orgUnit/changeType': {
            if (state.orgUnits.length < 1) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            state.orgUnits.push(orgUnitId);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    type: orgUnitTypes[Math.floor(Math.random() * orgUnitTypes.length)]
                }
            });
        }

        case 'orgUnit/moveOrgUnit': {
            if (state.orgUnits.length < 3) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            const orgUnitIdFrom = state.orgUnits.shift();
            const orgUnitIdTo = state.orgUnits.shift();

            state.orgUnits.push(orgUnitId);
            state.orgUnits.push(orgUnitIdFrom);
            state.orgUnits.push(orgUnitIdTo);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    toOrgUnitId: orgUnitIdTo,
                    fromOrgUnitId: orgUnitIdFrom
                }
            });
        }

        case 'orgUnit/delete': {
            if (state.orgUnits.length < 1) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type
            });
        }

        case 'orgUnit/addOrgUnit': {
            if (state.orgUnits.length < 2) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            const orgUnitIdTo = state.orgUnits.shift();

            state.orgUnits.push(orgUnitId);
            state.orgUnits.push(orgUnitIdTo);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    orgUnitId: orgUnitIdTo
                }
            });
        }

        case 'orgUnit/removeOrgUnit': {
            if (state.orgUnits.length < 2) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            const orgUnitIdTo = state.orgUnits.shift();

            state.orgUnits.push(orgUnitId);
            state.orgUnits.push(orgUnitIdTo);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    orgUnitId: orgUnitIdTo
                }
            });
        }

        case 'orgUnit/addUser': {
            if (state.orgUnits.length < 1) return Promise.resolve();
            if (state.users.length < 1) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            const userIdTo = state.users.shift();

            state.orgUnits.push(orgUnitId);
            state.users.push(userIdTo);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    userId: userIdTo
                }
            });
        }

        case 'orgUnit/removeUser': {
            if (state.orgUnits.length < 1) return Promise.resolve();
            if (state.users.length < 1) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            const userIdTo = state.users.shift();

            state.orgUnits.push(orgUnitId);
            state.users.push(userIdTo);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    userId: userIdTo
                }
            });
        }

        case 'orgUnit/moveUser': {
            if (state.orgUnits.length < 1) return Promise.resolve();
            if (state.users.length < 1) return Promise.resolve();

            const orgUnitId = state.orgUnits.shift();
            const userIdTo = state.users.shift();

            state.orgUnits.push(orgUnitId);
            state.users.push(userIdTo);

            return commandExecute({
                aggregateId: orgUnitId,
                aggregateName,
                type,
                payload: {
                    userId: userIdTo
                }
            });
        }

        case 'objective/create': {
            const isUserObjective = !!Math.round(Math.random());

            if (isUserObjective) {
                if (state.users.length < 1) return Promise.resolve();

                const objective = { id: uuid.v4(), keyResults: [] };
                state.objectives.push(objective);

                const userId = state.users.shift();
                state.users.push(userId);

                return commandExecute({
                    aggregateId: objective.id,
                    aggregateName,
                    type,
                    payload: {
                        title: uuid.v4(),
                        period: uuid.v4(),
                        userId
                    }
                });
            }

            if (state.orgUnits.length < 1) return Promise.resolve();

            const objective = { id: uuid.v4(), keyResults: [] };
            state.objectives.push(objective);

            const orgUnitId = state.orgUnits.shift();
            state.orgUnits.push(orgUnitId);

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type,
                payload: {
                    title: uuid.v4(),
                    period: timePeriods[Math.floor(Math.random() * timePeriods.length)],
                    orgUnitId
                }
            });
        }

        case 'objective/changeTitle': {
            if (state.objectives.length < 1) return Promise.resolve();

            const objective = state.objectives.shift();
            state.objectives.push(objective);

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type,
                payload: {
                    title: uuid.v4()
                }
            });
        }

        case 'objective/changeTimePeriod': {
            if (state.objectives.length < 1) return Promise.resolve();

            const objective = state.objectives.shift();
            state.objectives.push(objective);

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type,
                payload: {
                    period: timePeriods[Math.floor(Math.random() * timePeriods.length)]
                }
            });
        }

        case 'objective/delete': {
            if (state.objectives.length < 1) return Promise.resolve();

            const objective = state.objectives.shift();

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type
            });
        }

        case 'objective/addKeyResult': {
            if (state.objectives.length < 1) return Promise.resolve();

            const objective = state.objectives.shift();
            state.objectives.push(objective);

            const keyResultId = uuid.v4();
            objective.keyResults.push(keyResultId);

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type,
                payload: {
                    keyResultId,
                    title: uuid.v4(),
                    progress: Math.floor(Math.random() * 100)
                }
            });
        }

        case 'objective/updateKeyResult': {
            if (state.objectives.length < 1) return Promise.resolve();

            const objective = state.objectives.shift();
            state.objectives.push(objective);

            if (objective.keyResults.length < 1) return Promise.resolve();

            const keyResultId = objective.keyResults.shift();
            objective.keyResults.push(keyResultId);

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type,
                payload: {
                    keyResultId,
                    title: uuid.v4(),
                    progress: Math.floor(Math.random() * 100)
                }
            });
        }

        case 'objective/deleteKeyResult': {
            if (state.objectives.length < 1) return Promise.resolve();

            const objective = state.objectives.shift();
            state.objectives.push(objective);

            if (objective.keyResults.length < 1) return Promise.resolve();

            const keyResultId = objective.keyResults.shift();

            return commandExecute({
                aggregateId: objective.id,
                aggregateName,
                type,
                payload: {
                    keyResultId
                }
            });
        }

        default:
            return Promise.reject(`Unknown type ${command}`);
    }
}

function generateCommandsRaw(commandMap, commandName, commandLambda, endtime) {
    let currentTime = 0;
    while (currentTime < endtime) {
        const nextTime = currentTime + rpoisson(commandLambda);
        commandMap.set(nextTime, commandName);
        currentTime = nextTime;
    }
}

function generateCommands(commandsWeight, endTime) {
    const commandMap = new Map();

    Object.keys(commandsWeight).forEach(rootKey =>
        Object.keys(commandsWeight[rootKey]).forEach(key =>
            generateCommandsRaw(
                commandMap,
                `${rootKey}/${key}`,
                commandsWeight[rootKey][key],
                endTime
            )
        )
    );

    return commandMap;
}

function executeCommands(state, commands, position, endCallback, reportObj) {
    reportObj.value++;
    if (commands.length <= position) {
        return endCallback();
    }

    return Promise.resolve()
        .then(() => executeCommandByType(commands[position], state))
        // eslint-disable-next-line no-console
        .catch(err => console.log(`Error due perform command: ${err}`))
        .then(() => setImmediate(() =>
            executeCommands(state, commands, position + 1, endCallback, reportObj)
        ));
}

export default function commandGenerator(eventsWeight, endTime, reportObj) {
    const commandMap = generateCommands(eventsWeight, endTime);
    const state = {
        users: [],
        orgUnits: [],
        objectives: []
    };

    const commandArray = [];
    const unsortedArray = [];

    commandMap.forEach((value, key) => unsortedArray.push(key));

    unsortedArray
        .sort((a, b) => a - b)
        .forEach(key => commandArray.push(commandMap.get(key)));

    let resolver = null;
    const promise = new Promise(resolve => (resolver = resolve));
    executeCommands(state, commandArray, 0, resolver, reportObj);

    return promise;
}
