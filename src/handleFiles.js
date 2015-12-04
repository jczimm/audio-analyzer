/* global interfaceStateController, $interface, $fileInput */

const path = require('path');

import util from './util';
import notifications from './notifications';

import prepareFiles from './prepareFiles.js';

const invalidFileFormatMsg = (fileName) => `${fileName}: Invalid file format (currently, only .wav and .mp3 files are supported)`;

                    // `files` is of type FileList
export default function handleFiles(files) {
    const filePaths = [];

    // fill filePaths
    let fileName, file; // `file` is of type File
    for (let i = 0; i < files.length; i++) {
        file = files.item(i);
        fileName = file.name;
        if (!/\.(?:wav|mp3)$/i.test(path.basename(fileName))) {
            console.error('ERR: ' + invalidFileFormatMsg(fileName));
            notifications.err(invalidFileFormatMsg(fileName));
        } else {
            filePaths.push(file.path);
        }
    }

    util.resetInput($fileInput);

    if (filePaths[0]) {
        prepareFiles(filePaths)
            .then((/* displayedFilePaths */) => {
                // update interface the interface to idle state
                interfaceStateController.state = 'idle';
            });

            // errors are already handled in try..catch
            // .catch((/* err */) => {
            //     // console.log(err);
            // });
    }
}
