```
Code Quality:

  ☐ use DocBlockr to generate simple documentation for [functions in] .js files

  Refactoring:
    ☐ standardize options-object paradigm across all functions
      - main.js
      - util.js
      - fileList.js
      - fileWriter.js
      - loadingStates.js
      - loadLibraries.js
      - notifications.js

  ☐ apply rscss style guide to html and scss files (see http://rscss.io)
    ☐ edit index.html
    ☐ reorganize + re-style styles in style.scss into components/*.scss (one file for each 'component'; see rscss spec)


UI:
  TODO's related to the user interface of the program.

    Track Analysis:
     ✔ disable checkbox when analyzing a track @done (15-10-01 09:32)
     ✔ when track analysis errs, turn progress bar red @done (15-10-01 09:38)
     ☐ FIXME: show a progress bar when saving an .afa file (replace .analysis-progress with an accent-color bar)

    General: 
     ☐ Implement electron-drag for title bar (replacing -webkit-app-region) (https://github.com/kapetan/electron-drag)
     ☐ display "drop more tracks here" banner at bottom of .interface:not(.blank):not(.working)
     ☐ format Analysis Files Destination label

Distribution:
  ✔ fix packaging (in dist/win/Audio Analyzer for MAV-win32-ia32/, `electron` and .exe do not run app) @done (15-10-02 21:12)
  ☐ create a better icon (+ then remove attribution in CREDITS.md)

Development:
  ☐ implement a way to interface with running script

  vantage: interface in the cli
  node-inspector: debugger interface for node.js applications that uses the Blink Developer Tools 
  (see https://github.com/atom/electron/blob/master/docs/tutorial/debugging-main-process.md#use-node-inspector-for-debugging) 

Distribution:
  ☐ disable development shortcuts (e.g. CTRL+R, CTRL+SHIFT+I) in app in a non-development environment

```