// mostly copied and slightly simplified windy DESKTOP picker.  // I am not bothering with mobile for now.

import { map } from '@windy/map';
import plugins from '@windy/plugins';
import bcast from '@windy/broadcast';
import store from '@windy/store';
import { t } from '@windy/trans';

import { $, copy2clipboard, debounce, logError, normalizeLatLon, throttle } from '@windy/utils';
import { getLatLonInterpolator } from '@windy/interpolator';
import overlays from '@windy/overlays';
import * as format from '@windy/format';
import { emitter as pickerEmitter } from '@windy/picker';

import { addPickerCtrl } from './pickerCtrl.js';
import { insertPickerCss, removePickerCss } from './pickerCss.js';

/** Leaflet marker,  add stuff to it */
let marker;

let formatDir, pickerContentEl, isZooming, interpolateLatLon, displayLatLon;

let clickHandlersAdded = false;

function checkIfMapCrossedAntiM() {
    const { lat, lng } = marker.getLatLng();
    const d = map.getCenter().lng - lng;
    if (d > 180) {
        marker.setLatLng([lat, lng + 360]);
        update();
    } else if (d < -180) {
        marker.setLatLng([lat, lng - 360]);
        update();
    }
}

/** return leaflet marker already made,  or initialize it and add custom methods  */
function getPickerMarker() {

    if (plugins['custom-picker-for-windy-plugins']) {
        return plugins['custom-picker-for-windy-plugins'];
    } else {

        // create picker

        insertPickerCss();

        let html = `<div class="picker-lines noselect"></div>
        <div class="picker-content noselect">
            <span data-ref="content"></span>
            <a class="picker-link iconfont tooltip-down hide-on-picker-drag" data-do="detail" data-tooltip="${t.D_FCST}"
                >?</a
            >
            <a
                class="picker-close-button hide-on-picker-drag"
                
                data-icon=""
            ></a>

            <div id="picker-div-left">left</div>
            <div id="picker-div-right">right</div>

        </div>`;

        const icon = L.divIcon({
            className: 'custom-picker open',
            html,
            iconSize: [0, 125],
            iconAnchor: [0, 125],
        });

        marker = L.marker([0, 0], { icon: icon, draggable: true, zIndexOffset: 800 })
            .on('dragstart', dragstart)
            .on('drag', throttledUpdate)
            .on('dragend', dragend);

        plugins['custom-picker-for-windy-plugins'] = marker;

        // add methods to picker marker

        marker.openMarker = (latLon) => {
            latLon.source = "custom-picker";

            pickerEmitter.emit(
                map.hasLayer(marker) ? 'pickerMoved' : 'pickerOpened',
                latLon
            );

            marker.setLatLng([latLon.lat, latLon.lon || latLon.lng]);
            
            // if already on  map,  not repeated by Leaflet
            marker.addTo(map);
            marker.isOpen = true;
            displayLatLon = store.get('latlon');

            // cannot add clickhandlres until marker has been added to the map the 1st time.
            if (!clickHandlersAdded) {
                $('.picker-close-button', $('.custom-picker')).addEventListener("click", marker.removeMarker);

                $('.picker-content', $('.custom-picker')).addEventListener("click", e => {
                    e.stopPropagation();
                    if (e.target.dataset.do == "detail") {
                        bcast.emit("rqstOpen", "detail", marker.getParams());
                        marker.removeMarker();
                        return
                    };
                    if (displayLatLon) {
                        let latLon = marker.getParams();
                        if (latLon) {
                            let txt = `${normalizeLatLon(latLon.lat)}, ${normalizeLatLon(latLon.lon)}`;
                            copy2clipboard(txt);
                            console.log("Copied to clipboard", txt);
                        }
                    }
                })
                clickHandlersAdded = true;
            }

            pickerContentEl = $('[data-ref="content"]', $('.custom-picker'));

            updateInterFun();
            onMetricChanged();

            // add listeners.
            bcast.on('redrawFinished', updateInterFun,);
            bcast.on('metricChanged', onMetricChanged);
            store.on('product', invalidateInterFun);
            store.on('latlon', onLatLonChange);
            map.on('drag', checkIfMapCrossedAntiM);

            marker.openFxs?.forEach(f => f.cbf(latLon));
        }

        marker.removeMarker = (e) => {
            let latLon = marker.getParams();
            e?.stopPropagation();
            marker?.remove();

            pickerEmitter.emit('pickerClosed', latLon);

            // add listeners.
            bcast.off('redrawFinished', updateInterFun,);
            bcast.off('metricChanged', onMetricChanged);
            store.off('product', invalidateInterFun);
            store.off('latlon', onLatLonChange);
            map.off('drag', checkIfMapCrossedAntiM);
            marker.isOpen = false;
            clickHandlersAdded = false;

            marker.closeFxs?.forEach(f => f.cbf(latLon));
        }

        marker.getParams = () => {
            if (!marker.isOpen) return null;
            const latLng = marker.getLatLng().wrap(); // wrap here, used to broadcast picker coords
            return {
                lat: latLng.lat,
                lon: latLng.lng,
                source: 'custom-picker',
            };
        }

        /** remove picker marker,  destroy marker object and remove the css   */
        marker.destroyMarker = () => {
            if (marker?.isOpen) marker.removeMarker();
            marker = null;
            plugins['custom-picker-for-windy-plugins'] = null;
            clickHandlersAdded = false;
            removePickerCss();
        }

        addPickerCtrl(marker);

        return marker;
    }
}

function onMetricChanged() {
    formatDir = format.getDirFunction();
    update();
}

function onLatLonChange(d) {
    displayLatLon = d;
    getValuesAndRender();
}

function createHTML(values, coords) {
    const overlay = store.get('overlay');
    let text = overlays[overlay].createPickerHTML(values, formatDir);

    if (displayLatLon && coords) {
        const crds = format.DD2DMS(coords.lat, wrapLn(coords.lon));
        text += `<a class="picker-latlon" id="coords-to-clipboard" data-tooltip="${t.COPY_TO_C}">${crds}</a>`;
    }

    return text;
}

function render(values, coords) {
    if (Array.isArray(values)) {
        pickerContentEl.innerHTML = createHTML(values, coords);
    }
    // NaN no data value
    else {
        pickerContentEl.innerHTML = '';
    }
}

function wrapLn(ln) {
    return ln - Math.floor((ln + 180) / 360) * 360;
}

function setPickerLocation(coords) {
    let lat = coords.lat;
    let lon = wrapLn(coords.lon);

    store.set('pickerLocation', { lat, lon });
}

function getValuesAndRender() {
    // this method is throttled and debounced, marker can be closed already, chech it for to be sure
    const coords = marker.getLatLng();
    const values = interpolateLatLon({ lat: coords.lat, lon: coords.lng });

    render(values, coords);
    setPickerLocation(coords);
}

const throttledUpdate = throttle(getValuesAndRender, 300);
const debouncedUpdate = debounce(getValuesAndRender, 150);

function update() {
    if (isZooming) {   // todo not useing isZooming.   figure out what is point of isZooming??
        return;
    }
    // when staying at any point, we want to show the most up-to-date value, so debounce
    debouncedUpdate();
}

function getInterpolator() {
    invalidateInterFun();
    return new Promise(resolve => {
        getLatLonInterpolator().then((interFun) => {
            interpolateLatLon = interFun;
            resolve();
        });
    });
}

function updateInterFun() {
    getInterpolator().then(() => update());
}

function invalidateInterFun() {
    interpolateLatLon = () => null;
    update();
}

function dragstart() {
    document.body.classList.add('picker-dragging');
}

function dragend() {
    document.body.classList.remove('picker-dragging');
    update();
    pickerEmitter.emit('pickerMoved', marker.getParams());
}


export { getPickerMarker }




