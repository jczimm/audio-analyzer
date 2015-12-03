/* global fileList */

import util from './util';

// todo: try making it work as an async func again... maybe babel has improved?
// (problem had been that it was not actually awaiting the .displayFile's)

//old code:
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


export default function prepareFile(filePaths) {
    return new Promise((resolve, reject) => {
        util.tmp.copyFilesToTmp(filePaths) //
            .then((tmpFilePaths) => {
                Promise.all(tmpFilePaths.map(::fileList.displayFile)) //
                    .then((displayedFilePaths) => {
                        resolve(displayedFilePaths); //
                    }).catch(util.handleErr);
            }).catch(util.handleErr);
    });
}