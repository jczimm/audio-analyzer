/* global globals */

import util from './util';

export default async function prepareFiles(filePaths) {
    try {
        // copy files to tmp
        const tmpFilePaths = await util.tmp.copyFilesToTmp(filePaths);

        // display files (automatically registers `filePath`'s and `entry`'s')
        return await util.Promise.when(tmpFilePaths.map(::globals.fileList.displayFile));
    } catch (err) {
        return err;
    }
}
