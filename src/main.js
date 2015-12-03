/* global trackListTable, interfaceStateController, destPicker, $fileInput  */

require('./globals');

//

import InterfaceStateController from './interfaceStateController';
window.interfaceStateController = new InterfaceStateController();
interfaceStateController.state = 'blank'; // to bind blank state handlers

import LoopsController from './LoopsController';
window.loopsController = new LoopsController();

//

import ActionButton from './ActionButton';
window.actionButton = new ActionButton({
    $processButton: $('#process-button'),
    $stopButton: $('#stop-button')
});

import FileList from './FileList';
window.fileList = new FileList({ trackListTable });

import OptionsMenu from './OptionsMenu';
window.optionsMenu = new OptionsMenu();
window.optionsMenu.bindHandlers();

import FilePickerDialog from './FilePickerDialog';
window.destPicker = new FilePickerDialog();

import FileWriter from './FileWriter';
window.fileWriter = new FileWriter();

//

const ipc = require('electron').ipcRenderer;
$('#exit-button').click(() => {
    ipc.sendSync('window', 'close');
});

import util from './util';
$('#interface #track-list').click(util.stopPropagation);
$('.mdl-menu.main, .mdl-menu.main *').click(util.stopPropagation);

