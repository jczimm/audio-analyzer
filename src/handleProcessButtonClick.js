/* global globals */

// TODO: clean up this file; make it more straightforward and more structurally terse


import util from './util';

import notifications from './notifications';


import processFiles from './processFiles';

const maxConcurrentCtxs = 1;


function process(files) {
    // process the first batch of files
    let numProcessed = 0, nextFile;

    const firstFiles = util.sliceObj(files, 0, maxConcurrentCtxs);

    const beforeEachTrack = function beforeEachTrack() {
        numProcessed++;
    };

    const onOneTrackDone = function onOneTrackDone(file) {
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
            globals.interfaceStateController.state = 'idle';
        }
    };

    // if analysis is currently stopping or has been stopped (interface now in idle state),
    if (globals.interfaceStateController.isState('stopping') || globals.interfaceStateController.isState('idle')) {
        return; // then exit
    }

    processFiles(firstFiles, { beforeEachTrack, onOneTrackDone });
}

const maxTimesErred = 5;
function start(files) {
    let numErred = 0;

    const tryTestAnalysis = () => {
        console.log('%ctesting audio...', 'font-weight: 600; color: blue;');
        util.testAudio.testAudioAnalysis().then((r) => {
            console.log(r);
            console.log('%ctest successful.', 'font-weight: 600; font-size: 1.2em; color: blue;');
            //
            globals.interfaceStateController.state = 'working'; // go into working state (visually)

            console.log('%cprocessing...', 'font-weight: 600; font-size: 1.2em; color: blue;');
            process(files);
            //
        }).catch((errInfo) => {
            //
            if (numErred < maxTimesErred - 1) {
                numErred++;
                tryTestAnalysis();
            } else {
                console.log('%ctest failed.', 'font-weight: 600; font-size: 1.2em; color: red;');
                globals.interfaceStateController.state = 'idle'; // [return to] idle state
                util.handleError(errInfo);
            }
        });
    };

    globals.interfaceStateController.state = 'testing'; // show loading (waiting) button (icon)
    tryTestAnalysis();
}

export default function handleProcessButtonClick() {
    if (!globals.destPicker.paths[0]) {
        const path = globals.optionsMenu.promptDestPicker();

        if (path !== undefined && path.length > 0) {
            start(globals.fileList.files);
        } else {
            notifications.err({
                msg: 'Error: No destination directory was provided.',
                action: {
                    text: 'Try Again',
                    click() {
                        handleProcessButtonClick();
                        return;
                    },
                },
            });
        }
    } else {
        start(globals.fileList.files);
    }
}
