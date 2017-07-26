import fs from 'fs-extra';
import { DEV_STATIC_PATH, PROD_STATIC_PATH } from '../configs';

try {
    fs.copySync(DEV_STATIC_PATH, PROD_STATIC_PATH);
} catch (e) {
    if (e.code !== 'ENOENT')
        // eslint-disable-next-line no-console
        console.log('Static directory can not be copied: ', e);
}
