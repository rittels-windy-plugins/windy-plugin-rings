// @ts-nocheck

// at the moment,   errors occuring in imported ts modules,  are not shown in devtools,  so I stick with js for now.

import bcast from '@windy/broadcast';
import { $, getRefs } from '@windy/utils';
import { emitter as picker } from '@windy/picker';
import * as singleclick from '@windy/singleclick';
import loc from '@windy/location';
import metrics from '@windy/metrics';

import config from './pluginConfig';
import { insertGlobalCss, removeGlobalCss } from './globalCss.js';
import { getPickerMarker } from 'custom-windy-picker';
import { checkVersion, showMsg } from './utils/infoWinUtils.js';

const { name } = config;
const { log } = console;

// these will be set at init
let thisPlugin, refs, node;

let hasHooks = false;

let pickerT;

let loggerTO;
function logMessage(msg) {
    if (!store.get('consent')) return;
    if (!store.get('consent').analytics) return;
    fetch(`https://www.flymap.org.za/windy-logger/logger.htm?name=${name}&message=${msg}`, {
        cache: 'no-store',
    }).then(console.log);
}

function init(plgn) {
    thisPlugin = plgn;

    node = $('#plugin-' + plgn.ident);
    ({ refs } = getRefs(node)); // refs refreshed.

    // important to close picker
    bcast.fire('rqstClose', 'picker');

    //??? should I open my picker if windy picker was open

    pickerT = getPickerMarker();

    // add[Right|Left]Plugin is done by focus

    if (hasHooks) return;

    // log message
    let devMode = loc.getURL().includes('windy.com/dev');
    logMessage(devMode ? 'open_dev' : 'open_user');
    if (!devMode) loggerTO = setTimeout(logMessage, 1000 * 60 * 3, '3min');
    //

    //  single click stuff
    singleclick.singleclick.on(name, pickerT.openMarker);
    bcast.on('pluginOpened', onPluginOpened);
    bcast.on('pluginClosed', onPluginClosed);
    //

    insertGlobalCss();

    pickerT.onDrag(updateRings);
    picker.on('pickerOpened', updateRings);
    picker.on('pickerMoved', updateRings);
    picker.on('pickerClosed', removeAllRings);

    //checkVersion(refs.messageDiv);

    // needed???
    thisPlugin.closeCompletely = closeCompletely;

    hasHooks = true;
}

function closeCompletely() {
    console.log('RINGS closing completley');

    clearTimeout(loggerTO);

    // click stuff
    singleclick.release(name, 'high');
    singleclick.singleclick.off(name, pickerT.openMarker);
    bcast.off('pluginOpened', onPluginOpened);
    bcast.off('pluginClosed', onPluginClosed);

    removeGlobalCss();

    // other plugins will try to defocus this plugin.
    delete thisPlugin.focus;
    delete thisPlugin.defocus;
    //

    pickerT.offDrag(updateRings);
    picker.off('pickerOpened', updateRings);
    picker.off('pickerMoved', updateRings);
    picker.off('pickerClosed', removeAllRings);
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name);

    // clean up map layers
    removeAllRings();

    bcast.fire('rqstClose', name);

    pickerT = null; // in case plugin re-opened

    hasHooks = false;
}

//  VERY important:
function onPluginOpened(p) {
    // other external plugins do not get priority back,  when later reopened,  like better sounding.
    if (W.plugins[p].listenToSingleclick && W.plugins[p].singleclickPriority == 'high') {
        singleclick.register(p, 'high');
    }
}
function onPluginClosed(p) {
    // if the plugin closed has high singleclickpriority,  it returns single click to default picker,
    // so instead register this plugin as priority high
    console.log('on plugin closed', p, 'this plugin gets priority', name);
    if (p !== name && W.plugins[p].singleclickPriority == 'high')
        singleclick.register(name, 'high');
}

export { init, closeCompletely };

// rest of plugin:

import { map } from '@windy/map';
import store from '@windy/store';

import LatLonV from 'geodesy/latlon-ellipsoidal-vincenty.js';
import LatLon from 'geodesy/latlon-spherical.js';

let vars = { vincenty: false, iVal: 50, units: metrics.distance.description[0] };

let embedRefs;

store.insert('windy-plugin-rings-vals', {
    def: [50],
    allowed: ar => ar.length == 0 || ar.every(e => typeof e === 'number' && e > 0),
    save: true,
});

store.insert('windy-plugin-rings-units', {
    def: 'km',
    allowed: metrics.distance.description,
    save: true,
});
vars.units = store.get('windy-plugin-rings-units');

let storedRingVals = store.get('windy-plugin-rings-vals');
let rings = storedRingVals.map(v => ({
    val: v,
    radius: metrics.distance.backConv[vars.units].conversion(v),
}));

/** possible places where coords are shown */
const showCoordsAr = ['Do not show coords', 'Picker Left', 'Picker Right', 'Pane'];
store.insert('windy-plugin-rings-show-coords', {
    def: showCoordsAr[0],
    allowed: showCoordsAr,
    save: true,
});
vars.showCoords = store.get('windy-plugin-rings-show-coords');

function updateUnits() {
    store.set('windy-plugin-rings-units', vars.units);
    updateRings();
}

/** store radii and then updateRings */
function updateRadius() {
    store.set(
        'windy-plugin-rings-vals',
        rings.map(e => e.val),
    );
    rings.map(e => (e.radius = metrics.distance.backConv[vars.units].conversion(e.val)));
    updateRings();
}

function updateRings(pos) {
    //console.log(pickerT);
    pos = pos || (pickerT && pickerT.getParams());
    if (!pos) return;

    let { vincenty } = vars;
    let ll = vincenty ? new LatLonV(pos.lat, pos.lon) : new LatLon(pos.lat, pos.lon);

    let maxIx = rings.reduce((a, e, i) => (e.radius > a.v ? { v: e.radius, i } : a), {
        v: 0,
        i: 0,
    }).i;

    let north = { lat: pos.lat },
        south = { lat: pos.lat },
        east = { lon: pos.lon },
        west = { lon: pos.lon };

    rings.forEach((r, i) => {
        r.cs = [...Array(vincenty ? 37 : 5).keys()].map(b => {
            b = b * (vincenty ? 10 : 90);
            let pnt = ll.destinationPoint(r.radius, b);
            if (i == maxIx) {
                if (b == 0) north = pnt;
                else if (b == 90) east = pnt;
                else if (b == 180) south = pnt;
                else if (b == 270) west = pnt;
            }
            return [pnt.lat, pnt.lon];
        });

        if (r.line && ((!vincenty && r.cs.length == 5) || (vincenty && r.cs.length == 37))) {
            r.line?.remove();
            r.line = null;
        }

        if (!r.line) {
            let opts = {
                color: 'white',
                weight: 1,
                opacity: 0.5,
                smoothFactor: 1,
                radius: r.radius,
                fill: false,
            };
            r.line = (vincenty ? L.polyline(r.cs, opts) : L.circle(ll, opts)).addTo(map);
        } else {
            if (vincenty) {
                r.line.setLatLngs(r.cs);
            } else {
                r.line.setLatLng(ll);
                r.line.setRadius(r.radius);
            }
        }
    });

    let html = `
    <div class="mb-5">
        <b>Center:</b><br> 
        Lat: ${(+pos.lat).toFixed(3)},  Lon: ${(+pos.lon).toFixed(3)}
    </div>
    <div>
        <b>Outer ring:</b><br>
        Lat: ${south.lat.toFixed(3)} to ${north.lat.toFixed(3)}<br>
        Lon: ${west.lon.toFixed(3)} to ${east.lon.toFixed(3)}<br>
    </div>`;

    switch (vars.showCoords) {
        case 'Pane':
            refs.pickerPos.innerHTML = '<b>Coordinates:</b><br>' + html;
            break;
        case 'Picker Left':
            if (pickerT.getLeftPlugin() == name) pickerT.fillLeftDiv(html, true);
            break;
        case 'Picker Right':
            if (pickerT.getRightPlugin() == name) pickerT.fillRightDiv(html);
            break;
        case 'Embedded box':
            embedRefs.coords.innerHTML = html;
            break;
    }
}

/** only remove the actual ring from the map */
function removeRing(ring) {
    if (ring && ring.line) ring.line.remove();
}

function removeAllRings() {
    // this is for closing the plugin,  and not removing individual rings,  do not need to store
    rings.forEach(r => {
        r.line?.remove();
        r.line = null;
    });
    //also clear pane
    if (vars.showCoords == 'Pane') refs.pickerPos.innerHTML = '';
}

/** switches to either the picker, pane or embedded box,  then updates the rings,  if the picker is open */
function switchCoordsDiv(coordDiv) {
    if (!pickerT) return;

    // 1st clear everything
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name);
    refs.pickerPos.innerHTML = '';

    if (coordDiv == 'Picker Left') pickerT.addLeftPlugin(name);
    else if (coordDiv == 'Picker Right') pickerT.addRightPlugin(name);

    let c = pickerT.getParams();
    if (c) updateRings(c);

    store.set('windy-plugin-rings-show-coords', coordDiv);
}

export { rings, vars, updateRings, updateRadius, removeRing, switchCoordsDiv, showCoordsAr };
