export function getCDNBasedUrl({ CDNUrl, dir, uploadId, token }: {
    CDNUrl: any;
    dir: any;
    uploadId: any;
    token: any;
}): string;
export function getFormUpload({ dir }: {
    dir: any;
}): Promise<any>;
export function getUploadUrl({ dir }: {
    dir: any;
}): Promise<any>;
export function getToken({ dir }: {
    dir: any;
}): Promise<string>;
export default createModule;
declare function createModule(options: any): {
    apiHandlers: {
        path: string;
        handler: {
            module: string;
            options: any;
        };
        method: string;
    }[];
};
