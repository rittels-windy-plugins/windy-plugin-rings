// @ts-nocheck

// at the moment,   errors occuring in imported ts modules,  are not shown in devtools,  so I stick with js for now.   

import bcast from '@windy/broadcast';
import { $, getRefs } from '@windy/utils';
import { emitter as picker } from '@windy/picker';
import * as singleclick from '@windy/singleclick';

import config from './pluginConfig';
import { insertGlobalCss, removeGlobalCss } from './globalCss.js';
import { getPickerMarker } from './picker.js';

const { name } = config;

// these will be set at init
let thisPlugin, refs, node;

let hasHooks = false;
let pickerT;

function init(plgn) {
    thisPlugin = plgn;

    ({ node } = plgn.window);
    ({ refs } = getRefs(node));  // refs refreshed.

    // important to close picker
    bcast.fire('rqstClose', 'picker');

    //??? should I open my picker if windy picker was open

    pickerT = getPickerMarker();

    // add[Right|Left]Plugin is done by focus

    if (hasHooks) return;

    //  click stuff
    singleclick.singleclick.on(name, pickerT.openMarker);
    bcast.on('pluginOpened', onPluginOpened);
    bcast.on('pluginClosed', onPluginClosed);

    insertGlobalCss();

    pickerT.onDrag(updateRings);
    picker.on('pickerOpened', updateRings);
    picker.on('pickerMoved', updateRings);
    picker.on('pickerClosed', removeAllRings);

    // needed???
    thisPlugin.closeCompletely = closeCompletely;

    hasHooks = true;
}

function closeCompletely() {
    console.log("RINGS closing completley");

    // click stuff
    singleclick.release(name, "high");
    singleclick.singleclick.off(name, pickerT.openMarker);
    bcast.off('pluginOpened', onPluginOpened);
    bcast.off('pluginClosed', onPluginClosed);

    removeGlobalCss();

    pickerT.offDrag(updateRings);
    picker.off('pickerOpened', updateRings);
    picker.off('pickerMoved', updateRings);
    picker.off('pickerClosed', removeAllRings);
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name);

    // clean up map layers
    removeAllRings();

    bcast.fire('rqstClose', name);
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
    console.log("on plugin closed", p, "this plugin gets priority", name);
    if (p !== name && W.plugins[p].singleclickPriority == 'high') singleclick.register(name, 'high');
}

export { init, closeCompletely }

// rest of plugin:

import { map } from '@windy/map';
import store from '@windy/store';

import LatLonV from 'geodesy/latlon-ellipsoidal-vincenty.js';
import LatLon from 'geodesy/latlon-spherical.js';

let vars = { vincenty: false, iVal: 50000 };

let embedRefs;

store.insert('windy-plugin-rings-radii', {
    def: [50000],
    allowed: (ar) => ar.every(e => typeof e === 'number' && e > 0),
    save: true
});
let storedRadii = store.get('windy-plugin-rings-radii');
let rings = storedRadii.map(r => ({ radius: r }));

/** possible places wehre coords are shown */
const showCoordsAr = ['Do not show coords', 'Picker Left', 'Picker Right', 'Pane'];
store.insert('windy-plugin-rings-show-coords', {
    def: showCoordsAr[0],
    allowed: showCoordsAr,
    save: true
});
vars.showCoords = store.get('windy-plugin-rings-show-coords');

/** store radii and then updateRings */
function updateRadius() {
    store.set('windy-plugin-rings-radii', rings.map(e => e.radius));
    updateRings();
}

function updateRings(pos) {
    pos = pos || (pickerT && pickerT.getParams());
    if (!pos) return;

    let { vincenty } = vars;
    let ll = vincenty ? new LatLonV(pos.lat, pos.lon) : new LatLon(pos.lat, pos.lon);

    let maxIx = rings.reduce((a, e, i) => e.radius > a.v ? { v: e.radius, i } : a, { v: 0, i: 0 }).i;

    let north, south, east, west;

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
        })

        if (r.line && ((!vincenty && r.cs.length == 5) || (vincenty && r.cs.length == 37))) {
            r.line?.remove();
            r.line = null;
        }

        if (!r.line) {
            let opts = { color: 'white', weight: 1, opacity: 0.5, smoothFactor: 1, radius: r.radius, fill: false };
            r.line = (vincenty ? L.polyline(r.cs, opts) : L.circle(ll, opts)).addTo(map);
        } else {
            if (vincenty) { r.line.setLatLngs(r.cs); }
            else { r.line.setLatLng(ll); r.line.setRadius(r.radius); }
        }
    })

    let html = `
    <div class="mb-5">
        <b>Center:</b><br> 
        Lat: ${pos.lat.toFixed(3)},  Lon: ${pos.lon.toFixed(3)}
    </div>
    <div>
        <b>Outer ring:</b><br>
        Lat: ${south.lat.toFixed(3)} to ${north.lat.toFixed(3)}<br>
        Lon: ${west.lon.toFixed(3)} to ${east.lon.toFixed(3)}<br>
    </div>`;

    switch (vars.showCoords) {
        case 'Pane':
            refs.pickerPos.innerHTML = "<b>Coordinates:</b><br>" + html;
            break;
        case 'Picker Left':
            if (pickerT.getLeftPlugin() == name) pickerT.fillLeftDiv(html, true)
            break;
        case 'Picker Right':
            if (pickerT.getRightPlugin() == name) pickerT.fillRightDiv(html)
            break;
        case 'Embedded box':
            embedRefs.coords.innerHTML = html;
            break;
    }
}

function removeRing(ring) {
    ring.line.remove();
}

function removeAllRings() {
    rings.forEach(r => {
        r.line?.remove();
        r.line = null;
    })
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

    if (coordDiv == "Picker Left") pickerT.addLeftPlugin(name);
    else if (coordDiv == "Picker Right") pickerT.addRightPlugin(name);

    let c = pickerT.getParams();
    if (c) updateRings(c);

    store.set('windy-plugin-rings-show-coords', coordDiv);
}

export { rings, vars, updateRings, updateRadius, removeRing, switchCoordsDiv, showCoordsAr };
