// run before imports in main.js (created for util modules, which need __appdirname on import)

// used in subfolders for a concrete directory reference
global.__appdirname = __dirname;

//
const globals = {};

// cached `AudioContext` to be passed to `audioAnalyser`s
globals.audioCtx = new AudioContext();

//
require('./main');

global.globals = globals;

//

const ipc = require('electron').ipcRenderer;
$('#exit-button').click(() => {
    ipc.sendSync('window', 'close');
});

const util = require('./util'); // not import because that is hoisted to top of scope, where necessary globals (e.g. `__appdirname`) have not yet been created
$('#interface #track-list').click(util.stopPropagation);
$('.mdl-menu.main, .mdl-menu.main *').click(util.stopPropagation);
