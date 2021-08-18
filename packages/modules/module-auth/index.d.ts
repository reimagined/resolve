export default createUserModule;
declare function createUserModule(strategies: any): {
    apiHandlers: ({
        method: any;
        path: string;
        handler: {
            module: string;
            options: {
                strategyHash: string;
                options: any;
            };
            imports: {
                createStrategy: any;
                callback: any;
            };
        };
    } | {
        method: any;
        path: string;
        handler: string;
    })[];
};
