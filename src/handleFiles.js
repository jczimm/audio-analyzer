/* global globals */

const path = require('path');

import util from './util';

import prepareFiles from './prepareFiles.js';

const validFileTypes = ['.wav', '.mp3'];
const isValidFileType = (filePath) => Array.includes(validFileTypes, path.extname(path.basename(filePath)));
const invalidFileFormatErrMsg = (filePath) => `${filePath}: Invalid file format (currently, only .wav and .mp3 files are supported)`;

                    // `files` is of type FileList
export default function handleFiles(files) {
    const filePaths = [];

    // fill filePaths selectively
    let filePath, file; // `file` is of type File
    for (let i = 0; i < files.length; i++) {
        file = files.item(i);
        filePath = file.name;
        // ignore file if invalid file type
        if (!isValidFileType(filePath)) {
            const errMsg = invalidFileFormatErrMsg(filePath);
            util.handleError({
                err: new Error(errMsg),
                msg: errMsg,
                loc: 'handleFiles',
                notify: true,
            });
        } else filePaths.push(file.path);
    }

    util.resetInput(globals.$fileInput);

    if (filePaths[0]) {
        prepareFiles(filePaths)
            .then(([displayedFilePaths, errors]) => { // eslint-disable-line no-unused-vars
                // if there are errors,
                if (errors.filter(error => error !== undefined).length > 0) {
                    errors.forEach((err) => {
                        util.handleError(err);
                    });
                    return;
                }
                // update the interface to idle state
                globals.interfaceStateController.state = 'idle';
            })
            // `prepareFiles` rejects if from `util.copyFilesToTmp`
            .catch((err) => {
                util.handleError(err);
            });
    }
}
