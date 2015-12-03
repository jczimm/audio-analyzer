/* global interfaceStateController, $interface, $fileInput */

const path = require('path');

import util from './util';
import notifications from './notifications';

import prepareFiles from './prepareFiles.js';

var invalidFileFormatMsg = (fileName) => `${fileName}: Invalid file format (currently, only .wav and .mp3 files are supported)`;

function handleFiles(files) {
    var filePaths = [];

    // fill filePaths
    [].slice.call(files).forEach((file) => {
        let fileName = file.name;
        if (!/\.(?:wav|mp3)$/i.test(path.basename(fileName))) {
            console.error('ERR: ' + invalidFileFormatMsg(fileName));
            notifications.err(invalidFileFormatMsg(fileName));
        } else {
            filePaths.push(file.path);
        }
    });

    util.resetInput($fileInput);

    if (filePaths[0]) {
        prepareFiles(filePaths)
            .then((displayedFilePaths) => {
                // update interface the interface to idle state
                interfaceStateController.state = 'idle';
            })
            
            // errors are already handled in try..catch
            .catch((err) => {
                // console.log(err);
            });
    }
}

export default handleFiles;
