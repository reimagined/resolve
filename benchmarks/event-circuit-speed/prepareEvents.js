import commandGenerator from './commandGenerator';

export default function (eventsCount, reportObj) {
    // All the constants below are empirical numbers and are derived
    // from analysis of the current production OKR database
    const eventsWeight = {
        user: {
            create: 48,
            delete: 245
        },
        orgUnit: {
            create: 161,
            rename: 294,
            changeType: 2272,
            delete: 531,
            addOrgUnit: 161,
            addUser: 10,
            removeUser: 15,
            moveUser: 25000,
            removeOrgUnit: 25000,
            moveOrgUnit: 25000
        },
        objective: {
            create: 22,
            changeTitle: 274,
            changeTimePeriod: 274,
            delete: 833,
            addKeyResult: 10,
            updateKeyResult: 55,
            deleteKeyResult: 806
        }
    };

    const K = 0.33;

    return commandGenerator(
        eventsWeight,
        eventsCount / K,
        reportObj
    );

}

