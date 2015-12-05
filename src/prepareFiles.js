/* global fileList */

import util from './util';

// todo: try making it work as an async func again... maybe babel has improved?
// (problem had been that it was not actually awaiting the .displayFile's)

// old code:
// export default async function prepareFiles(filePaths) {
//     try {
//         let tmpFilePaths = await util.tmp.copyFilesToTmp(filePaths);
//
//         // display files (automatically registers `filePath`'s and `entry`'s')
//         return await * tmpFilePaths.map(::fileList.displayFile);
//
//     } catch (err) {
//         util.handleError(err);
//     }
// }


export default function prepareFiles(filePaths) {
    return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
        // copy files to tmp
        util.tmp.copyFilesToTmp(filePaths)
            .then((tmpFilePaths) => {
                // display the files in the file list
                util.Promise.when(tmpFilePaths.map(::fileList.displayFile)) // eslint-disable-line
                    .then(resolve);
            }).catch((err) => {
                reject(err);
            });
    });
}
