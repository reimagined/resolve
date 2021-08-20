import { PAUSE_REPLICATION, RESUME_REPLICATION, RESET_REPLICATION, REPLICATION_STATE } from './src' 
export { PAUSE_REPLICATION, RESUME_REPLICATION, RESET_REPLICATION, REPLICATION_STATE }
export default createModule;
declare function createModule(): {
    apiHandlers: {
        path: string;
        handler: string;
        method: string;
    }[];
};
