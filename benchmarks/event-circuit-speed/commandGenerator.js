import { rpoisson } from 'randgen';
import uuid from 'uuid';

import memoryDriver from 'resolve-bus-memory';
import createBus from 'resolve-bus';
import mongoDbDriver from 'resolve-es-mongo';
import createEs from 'resolve-es';
import createCommandExecutor from 'resolve-command';

import config from './config';

const createEvent = (type, args) => ({ ...args, type });

const store = createEs({ driver: mongoDbDriver({
    url: config.MONGODB_CONNECTION_URL,
    collection: config.MONGODB_COLLECTION_NAME
}) });

const bus = createBus({ driver: memoryDriver() });

const aggregates = [
    {
        name: 'item',
        commands: {
            createOuterItem: (state, args) => createEvent('OuterItemCreated', args),
            updateOuterItem: (state, args) => createEvent('OuterItemUpdated', args),
            deleteOuterItem: (state, args) => createEvent('OuterItemDeleted', args),
            createInnerItem: (state, args) => {
                const event = createEvent('InnerItemCreated', args);
                event.payload.innerItemId = event.payload.innerItemId || uuid.v4();
                return event;
            },
            updateInnerItem: (state, args) => createEvent('InnerItemUpdated', args),
            deleteInnerItem: (state, args) => createEvent('InnerItemDeleted', args)
        },
        handlers: {}
    },
    {
        name: 'member',
        commands: {
            create: (state, args) => createEvent('MemberCreated', args),
            delete: (state, args) => createEvent('MemberDeleted', args)
        },
        handlers: {}
    },
    {
        name: 'group',
        commands: {
            create: (state, args) => createEvent('GroupCreated', args),
            rename: (state, args) => createEvent('GroupRenamed', args),
            delete: (state, args) => createEvent('GroupDeleted', args),
            addGroup: (state, args) => createEvent('GroupAddedToGroup', args),
            addMember: (state, args) => createEvent('MemberAddedToGroup', args),
            removeMember: (state, args) => createEvent('MemberRemovedFromGroup', args),
            moveMember: (state, args) => createEvent('MemberMoved', args),
            removeGroup: (state, args) => createEvent('GroupRemovedFromGroup', args),
            moveGroup: (state, args) => createEvent('GroupMoved', args)
        },
        handlers: {}

    }
];

const commandExecute = createCommandExecutor({ store, bus, aggregates });

function executeCommandByType(command, state) {
    const [aggregateName, type] = command.split(/\//);
    switch (command) {
        case 'member/create': {
            const memberId = uuid.v4();
            state.members.push(memberId);

            return commandExecute({
                aggregateId: memberId,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4()
                }
            });
        }

        case 'member/delete': {
            if (state.members.length < 1) return Promise.resolve();

            const memberId = state.members.shift();

            return commandExecute({
                aggregateId: memberId,
                aggregateName,
                type
            });
        }

        case 'group/create': {
            const groupId = uuid.v4();
            state.groups.push(groupId);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4()
                }
            });
        }

        case 'group/rename': {
            if (state.groups.length < 1) return Promise.resolve();

            const groupId = state.groups.shift();
            state.groups.push(groupId);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4()
                }
            });
        }

        case 'group/moveGroup': {
            if (state.groups.length < 3) return Promise.resolve();

            const groupId = state.groups.shift();
            const groupIdFrom = state.groups.shift();
            const groupIdTo = state.groups.shift();

            state.groups.push(groupId);
            state.groups.push(groupIdFrom);
            state.groups.push(groupIdTo);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    toGroupId: groupIdTo,
                    fromGroupId: groupIdFrom
                }
            });
        }

        case 'group/delete': {
            if (state.groups.length < 1) return Promise.resolve();

            const groupId = state.groups.shift();

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type
            });
        }

        case 'group/addGroup': {
            if (state.groups.length < 2) return Promise.resolve();

            const groupId = state.groups.shift();
            const groupIdTo = state.groups.shift();

            state.groups.push(groupId);
            state.groups.push(groupIdTo);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    groupId: groupIdTo
                }
            });
        }

        case 'group/removeGroup': {
            if (state.groups.length < 2) return Promise.resolve();

            const groupId = state.groups.shift();
            const groupIdTo = state.groups.shift();

            state.groups.push(groupId);
            state.groups.push(groupIdTo);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    groupId: groupIdTo
                }
            });
        }

        case 'group/addMember': {
            if (state.groups.length < 1) return Promise.resolve();
            if (state.members.length < 1) return Promise.resolve();

            const groupId = state.groups.shift();
            const memberIdTo = state.members.shift();

            state.groups.push(groupId);
            state.members.push(memberIdTo);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    memberId: memberIdTo
                }
            });
        }

        case 'group/removeMember': {
            if (state.groups.length < 1) return Promise.resolve();
            if (state.members.length < 1) return Promise.resolve();

            const groupId = state.groups.shift();
            const memberIdTo = state.members.shift();

            state.groups.push(groupId);
            state.members.push(memberIdTo);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    memberId: memberIdTo
                }
            });
        }

        case 'group/moveMember': {
            if (state.groups.length < 1) return Promise.resolve();
            if (state.members.length < 1) return Promise.resolve();

            const groupId = state.groups.shift();
            const memberIdTo = state.members.shift();

            state.groups.push(groupId);
            state.members.push(memberIdTo);

            return commandExecute({
                aggregateId: groupId,
                aggregateName,
                type,
                payload: {
                    memberId: memberIdTo
                }
            });
        }

        case 'item/createOuterItem': {
            const isDirectMemberItem = !!Math.round(Math.random());

            if (isDirectMemberItem) {
                if (state.members.length < 1) return Promise.resolve();

                const outerItem = { id: uuid.v4(), items: [] };
                state.items.push(outerItem);

                const memberId = state.members.shift();
                state.members.push(memberId);

                return commandExecute({
                    aggregateId: outerItem.id,
                    aggregateName,
                    type,
                    payload: {
                        name: uuid.v4(),
                        memberId
                    }
                });
            }

            if (state.groups.length < 1) return Promise.resolve();

            const outerItem = { id: uuid.v4(), items: [] };
            state.items.push(outerItem);

            const groupId = state.groups.shift();
            state.groups.push(groupId);

            return commandExecute({
                aggregateId: outerItem.id,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4(),
                    groupId
                }
            });
        }

        case 'item/updateOuterItem': {
            if (state.items.length < 1) return Promise.resolve();

            const outerItem = state.items.shift();
            state.items.push(outerItem);

            return commandExecute({
                aggregateId: outerItem.id,
                aggregateName,
                type,
                payload: {
                    name: uuid.v4()
                }
            });
        }

        case 'item/deleteOuterItem': {
            if (state.items.length < 1) return Promise.resolve();

            const outerItem = state.items.shift();

            return commandExecute({
                aggregateId: outerItem.id,
                aggregateName,
                type
            });
        }

        case 'item/createInnerItem': {
            if (state.items.length < 1) return Promise.resolve();

            const outerItem = state.items.shift();
            state.items.push(outerItem);

            const innerItemId = uuid.v4();
            outerItem.items.push(innerItemId);

            return commandExecute({
                aggregateId: outerItem.id,
                aggregateName,
                type,
                payload: {
                    innerItemId,
                    name: uuid.v4()
                }
            });
        }

        case 'item/updateInnerItem': {
            if (state.items.length < 1) return Promise.resolve();

            const outerItem = state.items.shift();
            state.items.push(outerItem);

            if (outerItem.items.length < 1) return Promise.resolve();

            const innerItemId = outerItem.items.shift();
            outerItem.items.push(innerItemId);

            return commandExecute({
                aggregateId: outerItem.id,
                aggregateName,
                type,
                payload: {
                    innerItemId,
                    name: uuid.v4()
                }
            });
        }

        case 'item/deleteInnerItem': {
            if (state.items.length < 1) return Promise.resolve();

            const outerItem = state.items.shift();
            state.items.push(outerItem);

            if (outerItem.items.length < 1) return Promise.resolve();

            const innerItemId = outerItem.items.shift();

            return commandExecute({
                aggregateId: outerItem.id,
                aggregateName,
                type,
                payload: {
                    innerItemId
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
        members: [],
        groups: [],
        items: []
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
