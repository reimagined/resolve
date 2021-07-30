export default createModule;
declare function createModule(): {
    apiHandlers: {
        path: string;
        handler: string;
        method: string;
    }[];
};
