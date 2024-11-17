#!/bin/bash         

sudo ln ../infoWinUtils/infoWinUtils.js  ./src/utils/infoWinUtils.js
sudo ln ../infoWinUtils/infoWin_style_global.less  ./src/utils/infoWin_style_global.less
sudo ln ../infoWinUtils/infoWin_style_svelte.less  ./src/utils/infoWin_style_svelte.less
sudo ln ../picker/picker-src/picker.js  ./src/picker/picker.js
sudo ln ../picker/picker-src/pickerCtrl.js  ./src/picker/pickerCtrl.js
sudo ln ../picker/picker-src/pickerCss.js  ./src/picker/pickerCss.js


echo "done linking!"