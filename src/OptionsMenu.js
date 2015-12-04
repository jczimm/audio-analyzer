/* global destPicker, $, $fileInput, $pointsPerSecond, $pointsPerSecondCounter, $destLabel, $innerDestLabel */

import handleFiles from './handleFiles';
function handleFileInputChange() {
    handleFiles($(this).get(0).files);
}

function handlePointsPerSecondRangeChange(e) {
    const val = $(this).val();

    // make sure the slider never reaches zero
    // Note: the range input shouldn't have min=100 instead because the visual minimum should be 0
    if (parseInt(val, 10) === 0) {
        if (e) e.preventDefault();
        $(this).val(100); // set the position to 100,
        handlePointsPerSecondRangeChange(); // and call handler again to display it
    } else {
        $pointsPerSecondCounter.text(val);
    }
}

const destLabelHover = function destLabelHover() {
    const textWidth = $innerDestLabel.width();
    const labelWidth = $destLabel.parent().width() - 32; // width of li minus 2em on left (where button is)

    if (textWidth > labelWidth) { // if not the full width of the text in `$destLabel` is shown (= if there is hidden text),
        const rightPos = textWidth - labelWidth;
        const time = (textWidth - labelWidth + 16) * 6; // 6 ms for every pixel that will scroll

        // then return handlers for mousein and mouseout events on `$destLabel`
        return [
            function mouseIn() {
                $innerDestLabel.animate({
                    right: `${rightPos}px`,
                }, time, 'linear', function onAnimationFinish() {
                    $(this).stop();
                });
            },
            function mouseOut() {
                $innerDestLabel.stop().animate({
                    right: '0',
                }, 400, 'linear');
            },
        ];
    }
    // else just return empty array of no handlers
    // because in this case, we don't need the scroll effect on hover as there is nothing to scroll
    return [];
};

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
        const path = destPicker.pick()[0];

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
