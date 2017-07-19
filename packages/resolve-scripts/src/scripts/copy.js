import fs from 'fs-extra';

import { DEV_STATIC_PATH, PROD_STATIC_PATH } from '../configs';

fs.copySync(DEV_STATIC_PATH, PROD_STATIC_PATH);
