import commandGenerator from './commandGenerator';

export default function (eventsCount, reportObj) {
    const eventsWeight = {
        member: {
            create: 50,
            delete: 250
        },
        group: {
            create: 150,
            rename: 300,
            delete: 550,
            addGroup: 150,
            addMember: 10,
            removeMember: 15,
            moveMember: 25000,
            removeGroup: 25000,
            moveGroup: 25000
        },
        item: {
            createOuterItem: 20,
            updateOuterItem: 250,
            deleteOuterItem: 1000,
            createInnerItem: 10,
            updateInnerItem: 50,
            deleteInnerItem: 800
        }
    };

    const K = 0.33;

    return commandGenerator(
        eventsWeight,
        eventsCount / K,
        reportObj
    );

}

