import { $, copy2clipboard, debounce, logError, normalizelatLon, throttle } from '@windy/utils';


export function addPickerCtrl(marker) {

    const dragFxs = [], openFxs = [], closeFxs = [];

    Object.assign(marker, { dragFxs, openFxs, closeFxs });

    let pdr, pdl, rightDivAct, leftDivAct;
    let leftPlugins = [], rightPlugins = [];

    const checkIfMustClose = () => {
        if (dragFxs.length == 0 && openFxs.length == 0 && leftPlugins.length == 0 && rightPlugins.length == 0) {
            console.log("custom marker no longer needed and closing automatically");
            marker.destroyMarker();
        }
    }

    marker.onDrag = (cbf, interv) => {
        if (dragFxs.find(f => f.cbf == cbf)) return;
        let transformedCbf = e => {
            let latLon = e.latlng || marker._latlng || null;
            if (latLon) latLon.lon = latLon.lng;
            cbf(latLon);
        }
        let throttledCbf = throttle(transformedCbf, interv);
        let debouncedCbf = debounce(transformedCbf, interv);
        dragFxs.push({
            cbf,
            throttledCbf,
            debouncedCbf
        });
        marker.on("drag", throttledCbf);
        marker.on("dragend", debouncedCbf);
    }

    marker.offDrag = (cbf) => {
        let fxIx = dragFxs.findIndex(f => f.cbf == cbf);
        if (fxIx == -1) return;
        marker.off("drag", dragFxs[fxIx].throttledCbf);
        marker.off("dragend", dragFxs[fxIx].debouncedCbf);
        dragFxs.splice(fxIx, 1);
        checkIfMustClose();
    }

    marker.onOpen = (cbf) => {
        if (openFxs.find(f => f.cbf == cbf)) return;
        //should receive latLon;
        let transformedCbf = e => {
            let latLon = (e.lat !== undefined && e.lon !== undefined) ? e : marker._latlng || null;
            if (latLon) latLon.lon = latLon.lng;
            cbf(latLon);
        }
        openFxs.push({
            cbf,
            transformedCbf
        });
        // will be opened by openMarker in picker
    }

    marker.offOpen = (cbf) => {
        let fxIx = openFxs.findIndex(f => f.cbf == cbf);
        if (fxIx > -1) openFxs.splice(fxIx, 1);
        checkIfMustClose();
    }

    marker.onClose = (cbf) => {
        if (closeFxs.find(f => f.cbf == cbf)) return;
        closeFxs.push({ cbf });
        // will be opened by closeMarker in picker
    }

    marker.offClose = (cbf) => {
        let fxIx = openFxs.findIndex(f => f.cbf == cbf);
        if (fxIx > -1) closeFxs.splice(fxIx, 1);
    }

    function addContent(html, el) {
        if (html) {
            let show = true;
            if (html.nodeName == 'DIV') {
                if (html.innerHTML) {
                    for (; el.firstChild;) el.firstChild.remove();
                    el.appendChild(html);
                } else show = false;
            } else el.innerHTML = html;
            if (show) el.classList.add('show');
        } else {
            el.classList.remove('show');
        }
    }

    marker.fillRightDiv = (html) => {
        pdr = $("#picker-div-right");
        if (!pdr) return;
        addContent(html, pdr);
    };

    marker.fillLeftDiv = (html, pickerBckgCol = false) => {
        pdl = $("#picker-div-left");
        if (!pdl) return;
        if (pickerBckgCol) pdl.style.backgroundColor = 'rgba(68,65,65,0.84)';
        else pdl.style.backgroundColor = 'transparent';
        addContent(html, pdl);
    };

    function checkLeftDiv() {
        if (leftDivAct !== leftPlugins[0]) {
            pdl?.classList.remove("show");
        }
        leftDivAct = leftPlugins[0];
    }
    function checkRightDiv() {
        if (rightDivAct !== rightPlugins[0]) {
            pdr?.classList.remove("show");
        }
        rightDivAct = rightPlugins[0];
    }

    marker.addLeftPlugin = (plugin) => {
        leftPlugins = leftPlugins.filter(p => p !== plugin);
        leftPlugins.unshift(plugin);
        checkLeftDiv();
    };

    marker.getLeftPlugin = () => leftDivAct;

    marker.remLeftPlugin = plugin => {
        leftPlugins = leftPlugins.filter(p => p !== plugin);
        checkLeftDiv();
        checkIfMustClose();
    };

    marker.addRightPlugin = plugin => {
        rightPlugins = rightPlugins.filter(p => p !== plugin);
        rightPlugins.unshift(plugin);
        checkRightDiv();
    };

    marker.getRightPlugin = () => rightPlugins[0];

    marker.remRightPlugin = plugin => {
        rightPlugins = rightPlugins.filter(p => p !== plugin);
        checkRightDiv();
        checkIfMustClose();
    };
}

