/* global destPicker, $, $fileInput, $pointsPerSecond, $pointsPerSecondCounter, $destLabel, $innerDestLabel */


export default class OptionsMenu {
    
    constructor() {
        
    }
    
    bindHandlers() {
        $fileInput.change(handleFileInputChange);
        $pointsPerSecond.on('change input', handlePointsPerSecondRangeChange.bind($pointsPerSecond));
        
        $('#chooseDestButton').click(() => {
            this.promptDestPicker();
        }); // same as `.click(null::this.promptDestPicker)` ?
        
        //
        
        this.init();
    }
    
    init() {
        handlePointsPerSecondRangeChange.apply($pointsPerSecond);
    }
    
    promptDestPicker() {
        var path = destPicker.pick()[0];
    
        if (path) {
            $innerDestLabel.text(path);
            $destLabel.parent().addClass('filled');
            $('#chooseDestButton').removeClass('mdl-button--raised');
            
            $destLabel
                .off('mouseenter mouseleave') // remove hover handlers (only bound if this `promptDestPicker` called before)
                .hover(...destLabelHover()); // and reapply them
        }
    
        return path;
    }
    
}

//

import handleFiles from './handleFiles';
function handleFileInputChange() {
    handleFiles($(this).get(0).files);
}

function handlePointsPerSecondRangeChange(e) {
    var val = $(this).val();

    // make sure the slider never reaches zero
    // Note: the range input shouldn't have min=100 instead because the visual minimum should be 0
    if (parseInt(val) === 0) {
        if (e) e.preventDefault();
        $(this).val(100); // set the position to 100,
        handlePointsPerSecondRangeChange(); // and call handler again to display it
    } else {
        $pointsPerSecondCounter.text(val);
    }
} 

var destLabelHover = function destLabelHover() {
    var textWidth = $innerDestLabel.width(),
        labelWidth = $destLabel.parent().width() - 32; // width of li minus 2em on left (where button is)

    if (textWidth - labelWidth > 0) {
        var rightPos = textWidth - labelWidth,
            time = (textWidth - labelWidth + 16) * 6; // 6 ms for every pixel that will scroll

        return [
            function mouseIn() {
                $innerDestLabel.animate({
                    right: `${rightPos}px`
                }, time, 'linear', function () {
                    $(this).stop();
                });
            },
            function mouseOut() {
                $innerDestLabel.stop()
                    .animate({
                        right: '0'
                    }, 400, 'linear');
            }
        ];
    } else return [];
};