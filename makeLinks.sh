#!/bin/bash         

sudo ln ../infoWinUtils/infoWinUtils.js  ./src/infoWinUtils.js
sudo ln ../infoWinUtils/infoWin_style_global.less  ./src/infoWin_style_global.less
sudo ln ../infoWinUtils/infoWin_style_svelte.less  ./src/infoWin_style_svelte.less
sudo ln ../picker/picker-src/picker.js  ./src/picker.js
sudo ln ../picker/picker-src/pickerCtrl.js  ./src/pickerCtrl.js
sudo ln ../picker/picker-src/pickerCss.js  ./src/pickerCss.js


echo "done linking!"