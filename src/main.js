/* global globals */

import registerGlobals from './globals';
registerGlobals(globals);
//

import InterfaceStateController from './InterfaceStateController';
globals.interfaceStateController = new InterfaceStateController();
globals.interfaceStateController.state = 'blank'; // to bind blank state handlers

import LoopsController from './LoopsController';
globals.loopsController = new LoopsController();

//

import ActionButton from './ActionButton';
globals.actionButton = new ActionButton({
    $processButton: $('#process-button'),
    $stopButton: $('#stop-button'),
    $loadingButton: $('#loading-button'),
});

import FileList from './FileList';
globals.fileList = new FileList({ trackListTable: globals.trackListTable });

import OptionsMenu from './OptionsMenu';
globals.optionsMenu = new OptionsMenu();
globals.optionsMenu.bindHandlers();

import FilePickerDialog from './FilePickerDialog';
globals.destPicker = new FilePickerDialog();

import FileWriter from './FileWriter';
globals.fileWriter = new FileWriter();

