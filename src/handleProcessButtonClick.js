/* global destPicker, fileList, optionsMenu, interfaceStateController */

// TODO: clean up this file; make it more straightforward and more structurally terse


import util from './util';

import notifications from './notifications';


import processFiles from './processFiles';


const maxConcurrentCtxs = 1;
function handleProcessButtonClick() {

    if (!destPicker.paths[0]) {
        var path = optionsMenu.promptDestPicker();

        if (path !== undefined && path.length > 0) {
            startFiles(fileList.files);
        } else {
            notifications.err('Error: No destination directory was provided. [Try Again]'); // TODO: make [Try Again] a text button (material toast "action")
        }
    } else {
        startFiles(fileList.files);
    }

}

function startFiles(files) {
    interfaceStateController.state = 'working';

    process(files);
}

function process(files) {
    // process the first batch of files

    var numProcessed = 0,
        firstFiles = util.sliceObj(files, 0, maxConcurrentCtxs),
        nextFile;

    var beforeEachTrack = () => { numProcessed++; };

    var onOneTrackDone = function onOneTrackDone(file) {
        // processFiles calls `onOneTrackDone(null)` when skipping over tracks
        if (file !== null) {
            file.completed = true;
        }

        // for every track completed, process the next one on the queue and have `processFiles` call back
        // to this function after that track has completed
        nextFile = util.sliceObj(files, numProcessed, numProcessed + 1);

        // if there is a nextFile,
        if (!$.isEmptyObject(nextFile)) {
            // process it, passing a reference back to `beforeEachTrack` and `onOneTrackOne`
            processFiles(nextFile, { beforeEachTrack, onOneTrackDone });
        } else {
            // if there is no next track in the list, consider the process finished
            interfaceStateController.state = 'idle';
        }
    };

    // if analysis is currently stopping or has been stopped (interface now in idle state),
    if (interfaceStateController.isState('stopping') || interfaceStateController.isState('idle')) {
        return; // then exit
    }

    processFiles(firstFiles, { beforeEachTrack, onOneTrackDone });
}

export default handleProcessButtonClick;
