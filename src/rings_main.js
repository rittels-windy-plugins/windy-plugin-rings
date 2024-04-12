// @ts-nocheck

// at the moment,   errors occuring in imported ts modules,  are not shown in devtools,  so I stick with js for now.   

import bcast from '@windy/broadcast';
import { $, getRefs } from '@windy/utils';
import { emitter as picker } from '@windy/picker';

import config from './pluginConfig';
import { loadPlugins } from './loadPlugins.js';
import { insertGlobalCss, removeGlobalCss } from './globalCss.js';

const { name } = config;

// these will be set at init
let thisPlugin, refs, node;

let hasHooks = false;
let pickerT, embedbox;

function init(plgn) {

    thisPlugin = plgn;

    thisPlugin.isActive = true;
    ({ node } = plgn.window);
    ({ refs } = getRefs(node));  // refs refreshed.

    loadPlugins().then(mods => ({ pickerT, embedbox } = mods)).then(() => {
        // this has to be done even everytime opens,  since embedbox may have been closed by another plugin
        
        switchCoordsDiv(vars.showCoords);
        // will not be added more than once
        pickerT.drag(updateRings, 10);

    })

    if (hasHooks) return;

    insertGlobalCss();

    // whatever windy listeners are needed
    picker.on('pickerOpened', updateRings);
    picker.on('pickerMoved', updateRings);
    picker.on('pickerClosed', removeAllRings);

    thisPlugin.closeCompletely = closeCompletely;

    hasHooks = true;
}

function closeCompletely() {
    thisPlugin.isActive = false;
    removeGlobalCss();
    bcast.fire('rqstClose', name);

    // remove all listeners
    pickerT.dragOff(updateRings);
    picker.off('pickerOpened', updateRings);
    picker.off('pickerMoved', updateRings);
    picker.off('pickerClosed', removeAllRings);
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name);

    // clean up map layers
    removeAllRings();

    hasHooks = false;
}

export { init, closeCompletely }

///// boiler plate ends here

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

const showCoordsAr = ['Do not show coords', 'Picker Left', 'Picker Right', 'Embedded box', 'Pane'];
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
    let ll = vars.vincenty ? new LatLonV(pos.lat, pos.lon) : new LatLon(pos.lat, pos.lon);

    let maxIx = rings.reduce((a, e, i) => e.radius > a.v ? { v: e.radius, i } : a, { v: 0, i: 0 }).i;

    let north, south, east, west;

    rings.forEach((r, i) => {
        r.cs = [...Array(37).keys()].map(b => {
            let pnt = ll.destinationPoint(r.radius, b * 10);
            if (i == maxIx) {
                if (b == 0) north = pnt;
                else if (b == 9) east = pnt;
                else if (b == 18) south = pnt;
                else if (b == 27) west = pnt;
            }
            return [pnt.lat, pnt.lon];
        })
        if (!r.line) {
            r.line = new L.Polyline(r.cs, {
                color: 'white',
                weight: 1,
                opacity: 0.5,
                smoothFactor: 1
            }).addTo(map);
        } else {
            r.line.setLatLngs(r.cs)
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
    //also clear pane and embedbox;
    if (vars.showCoords == 'Pane') refs.pickerPos.innerHTML = '';
    else if (vars.showCoords == 'Embedded box') embedRefs.coords.innerHTML = '';
}

/** switches to either the picker, pane or embedded box,  then updates the rings,  if the picker is open */
function switchCoordsDiv(coordDiv) {

    // 1st clear everything
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name);
    embedbox.setHTML('');
    refs.pickerPos.innerHTML = '';

    let htmlPromise = Promise.resolve();
    if (coordDiv == "Picker Left") pickerT.addLeftPlugin(name);
    else if (coordDiv == "Picker Right") pickerT.addRightPlugin(name);
    else if (coordDiv == "Embedded box") {
        htmlPromise = embedbox.setHTML('<div data-ref="coords"></div>', name).then(({ refs }) => embedRefs = refs);
    }

    // unfortunately embedBox.setHTML returns a promise,  with the node and refs,  thus have to wait for it to resolve
    htmlPromise.then(() => {
        let c = pickerT.getParams();
        if (c) updateRings(c);
    })

    store.set('windy-plugin-rings-show-coords', coordDiv);
}

export { rings, vars, updateRings, updateRadius, removeRing, switchCoordsDiv, showCoordsAr };
