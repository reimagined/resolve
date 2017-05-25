import { MongoClient } from 'mongodb';

export function dropCollection(mongoUrl, collectionName) {
    return MongoClient.connect(mongoUrl).then(db =>
        new Promise(resolve => db.collection(
            collectionName,
            { strict: true },
            (err, collection) => (err ? resolve() : collection.drop().then(resolve))
        ))
        // eslint-disable-next-line no-console
        .catch(err => console.log('Error while drop collection:', err))
        .then(() => db.close())
    );
}

export function defaultXmlReport(data, customInfoProvider = () => '') {
    const points = Object.keys(data);

    return `<?xml version="1.0" ?>\n<tabs>
        ${points.map((point) => {
            const rss = Math.round(data[point].memory.rss / 1024 / 1024);
            const heapTotal = Math.round(data[point].memory.heapTotal / 1024 / 1024);
            const heapUsed = Math.round(data[point].memory.heapUsed / 1024 / 1024);

            return `<tab name="Events count: ${point}">`
                + `<field name="Build time" value="${data[point].buildTime} ms" />`
                + `<field name="Memory resident size" value="${rss} mb" />`
                + `<field name="Memory heap total" value="${heapTotal} mb" />`
                + `<field name="Memory heap used" value="${heapUsed} mb" />`
                +  customInfoProvider(data[point])
                + '</tab>';
        }).join('')}
        </tabs>`;
}

export function prepareCsv(data, dataGetter) {
    const points = Object.keys(data);

    return `${points.map(point => `Events count: ${point}`).join(',')}\n` +
        `${points.map(point => dataGetter(data[point])).join(',')}\n`;
}

export function defaultCsvReports(data) {
    return {
        buildTime: prepareCsv(info => `${info.buildTime}`),
        memoryRss: prepareCsv(info =>
            `${Math.round(info.memory.rss / 1024 / 1024)}`
        ),
        memoryHeapTotal: prepareCsv(info =>
            `${Math.round(info.memory.heapTotal / 1024 / 1024)}`
        ),
        memoryHeapUsed: prepareCsv(info =>
            `${Math.round(info.memory.heapUsed / 1024 / 1024)}`
        )
    };
}

export function defaultReporter(data, writer, customXmlInfoProvider = () => '') {
    const xmlReport = defaultXmlReport(data, customXmlInfoProvider);
    const csvReports = defaultCsvReports(data);

    return Promise.all([
        writer('./build-time.csv', csvReports.buildTime),
        writer('./memory-rss.csv', csvReports.memoryRss),
        writer('./memory-heap-total.csv', csvReports.memoryHeapTotal),
        writer('./memory-heap-used.csv', csvReports.memoryHeapUsed),
        writer('./summary.xml', xmlReport)
    ]);
}
