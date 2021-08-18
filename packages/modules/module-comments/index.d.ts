import * as defaults from './src/common/defaults';
import { CommentsNotificationRenderless, CommentsPaginateRenderless, CommentsTreeRenderless,RefreshHelperRenderless, createCommentsReducer } from './src/client'
export default serverEntry;
declare function serverEntry({ aggregateName, readModelName, readModelConnectorName, commentsTableName, eventTypes, commandTypes, resolverNames, maxNestedLevel, verifyCommand, commentsInstanceName, reducerName, }?: {
    aggregateName: string;
    readModelName: string;
    readModelConnectorName: string;
    commentsInstanceName: string;
    commentsTableName?: string;
    eventTypes?: any;
    commandTypes?: any;
    resolverNames?: any;
    maxNestedLevel?: number;
    verifyCommand?: any;
    reducerName?: string;
}): any;
export { defaults, CommentsNotificationRenderless, CommentsPaginateRenderless, CommentsTreeRenderless, RefreshHelperRenderless, createCommentsReducer };
