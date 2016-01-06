@echo off
start cmd /q /k "mode con: cols=100 lines=40 && %AppData%/npm/git-cz && powershell -command '&{$H=get-host;$W=$H.ui.rawui;$B=$W.buffersize;$B.width=100;$B.height=9999;$W.bu‌​ffersize=$B;}'"
