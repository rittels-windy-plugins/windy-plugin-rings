import { isTablet } from '@windy/rootScope';
import bcast from '@windy/broadcast';
import { $ } from '@windy/utils';
import http from '@windy/http';
import config from '../pluginConfig.js';

const { log } = console;

/**
 * @params el: sensitive element
 * @params onDrag: cbf when dragged,  receives:  hor pixel pos in parent, ver pixel pos in parent, and the original position of the parent of the sens element
 * @params onDragEnd:  cbf when drag ended.
 **/
function addDrag(el, onDrag, onDragEnd = () => {}) {
    let topMargin = parseInt(getComputedStyle(el)['margin-top']);
    let leftMargin = parseInt(getComputedStyle(el)['margin-left']);
    let top, topOffs, left, leftOffs;
    let initialParentPos;
    let mouseDown = false;
    const handleStart = e => {
        e.preventDefault();
        e.stopPropagation();
        top = el.offsetTop - topMargin;
        left = el.offsetLeft - leftMargin;
        let pos = e.targetTouches ? e.targetTouches[0] : e;
        topOffs = top - pos.pageY;
        leftOffs = left - pos.pageX;
        let {
            offsetTop: pTop,
            offsetLeft: pLeft,
            offsetWidth: pWidth,
            offsetHeight: pHeight,
        } = el.parentElement;
        initialParentPos = { pTop, pLeft, pWidth, pHeight };
        mouseDown = true;
    };
    const handleEnd = e => {
        mouseDown = false;
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('mousemove', handleMove);
        let pos =
            e.targetTouches && e.targetTouches.length
                ? e.targetTouches[0]
                : e.changedTouches && e.changedTouches.length
                  ? e.changedTouches[0]
                  : e;
       
        onDragEnd(leftOffs + pos.pageX, topOffs + pos.pageY, initialParentPos);
    };
    const handleCancel = e => {
        //console.log('cancel', e);
        onDragEnd();
    };
    /** provides to onDrag fx:  pix moved hor, pix moved ver, original pos of parent of el */
    const handleMove = e => {
        if (!mouseDown) return;
        let pos = e.targetTouches ? e.targetTouches[0] : e;
        onDrag(leftOffs + pos.pageX, topOffs + pos.pageY, initialParentPos);
        //el.style.top = topOffs + pos.pageY + 'px';
    };
    el.addEventListener('touchstart', handleStart);
    el.addEventListener('touchend', handleEnd);
    el.addEventListener('touchcancel', handleCancel);
    el.addEventListener('touchmove', handleMove);

    el.addEventListener('mousedown', e => {
        handleStart(e);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('mousemove', handleMove);
    });
}

/** shows the main box
 * @param {i} name:  is windy-plugin-xxx
 */
function showInfo(name) {
    let bdy = document.body;
    const msg = name => {
        const el = $(`#${name}-info`);
        if (!el) return;
        const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = el;
        return { left, top, width, height, name };
    };

    if (bdy.classList.contains(`on${name}-info`)) {
        bcast.fire('infoWinClosed', msg(name)); //bcast BEFORE removed
        bdy.classList.remove(`on${name}-info`);
    } else {
        bdy.classList.forEach(c => {
            let m = c.match(/onwindy-plugin-.*-info/);
            if (m) {
                bcast.fire('infoWinClosed', msg(m[0].replace('_info', ''))); //bcast BEFORE removed
                bdy.classList.remove(m[0]);
            }
        });
        bdy.classList.add(`on${name}-info`);
        bcast.fire('infoWinOpened', msg(name));
    }
}

function makeBottomRightHandle(el, div, callback) {
    const { id } = div;
    const name = id.replace('-info', '');
    addDrag(el, (x, y, pp) => {
        if (y + pp.pTop > window.innerHeight - 1) y = window.innerHeight - 1 - pp.pTop;
        if (x + pp.pLeft > window.innerWidth - 1) x = window.innerWidth - 1 - pp.pLeft;
        /** current left edge  */
        let cl = div.offsetLeft;
        /** current top edge */
        let ct = div.offsetTop;

        let t = pp.pTop + y - 75;
        if (t > ct) t = ct;
        if (t < 1) {
            t = 1;
            y = 76 - pp.pTop;
        }
        let h = y + (pp.pTop - ct);

        let l = pp.pLeft + x - 75;
        if (l > cl) l = cl;
        if (l < 1) {
            l = 1;
            x = 76 - pp.pLeft;
        }
        let w = x + (pp.pLeft - cl);

        div.style.height = h + 'px';
        div.style.width = w + 'px';
        div.style.left = l + 'px';
        div.style.top = t + 'px';

        div.classList.remove('narrow', 'medium', 'wide');
        div.classList.add(w < 200 ? 'narrow' : w < 380 ? 'medium' : 'wide');

        bcast.fire('infoWinResized', { left: l, top: t, width: w, height: h, id, name });
        if (callback) callback({ left: l, top: t, width: w, height: h, id, name }); // propably better to use bcast
    });
}

function makeTopLeftHandle(el, div, callback) {
    const { id } = div;
    const name = id.replace('-info', '');
    addDrag(el, (x, y, pp) => {
        /** current right edge */
        let cr = div.offsetLeft + div.offsetWidth;
        /** current bottom edge */
        let cb = div.offsetTop + div.offsetHeight;
        let l = pp.pLeft + x,
            t = pp.pTop + y;
        if (l < 1) l = 1;
        if (t < 1) t = 1;
        let r = l + 75,
            b = t + 75;
        if (r > window.innerWidth) {
            r = window.innerWidth - 1;
            l = r - 75;
        }
        if (b > window.innerHeight) {
            b = window.innerHeight - 1;
            t = b - 75;
        }
        if (r < cr) r = cr;
        if (b < cb) b = cb;
        let w = r - l,
            h = b - t;
        div.style.left = l + 'px';
        div.style.top = t + 'px';
        div.style.width = w + 'px';
        div.style.height = h + 'px';

        div.classList.remove('narrow', 'medium', 'wide');
        div.classList.add(w < 200 ? 'narrow' : w < 380 ? 'medium' : 'wide');

        bcast.fire('infoWinResized', { left: l, top: t, width: w, height: h, id, name });
        if (callback) callback({ left: l, top: t, width: w, height: h, id, name });
    });
}

function getWrapDiv() {
    let wrapDiv = document.getElementById('ext-plugin-info-wrapper');
    if (!wrapDiv) {
        wrapDiv = document.createElement('div');
        wrapDiv.id = 'ext-plugin-info-wrapper';
        document.body.appendChild(wrapDiv);
    }
    return wrapDiv;
}

/** this does not belong with infoWinUtils, but should be temporary.
 * It places the embedded plugin in small when tablet is used
 * */
function embedForTablet(thisPlugin) {
    let node = $('#' + thisPlugin.ident);
    if (isTablet && thisPlugin.pane == 'embedded') {
        node.classList.remove('fg-white', 'bg-transparent-blur', 'rounded-box');
        node.classList.add('plugin-mobile-bottom-small');
        document.querySelector('[data-plugin="bottom-below-controls-mobile"]').appendChild(node);
        node.style.width = 'auto';
        node.style.margin = '0px';
        thisPlugin.pane = 'small-bottom-bottom';
    }
}

// Other stuff used by all my plugins:

// Show message:
/**
 *
 * @param {*} messageDiv - ref to the div
 * @param {*} m - message
 * @param {*} timeout - in millisecs
 */
function showMsg(messageDiv, m, timeout = 30 * 1000) {
    messageDiv.innerHTML = m;
    messageDiv.classList.remove('hidden');
    if (timeout) setTimeout(() => messageDiv.classList.add('hidden'), timeout);
    //else do not remove the message
}

// Check version

/**
 * This is no longer needed,   version update done by Windy
 * @param {*} messageDiv - ref to the message div
 */
function checkVersion(messageDiv) {
    return;
    http.get('/articles/plugins/list').then(({ data }) => {
        let pluginInList = data.find(e => e.name == config.name);
        if (!pluginInList) {
            showMsg(messageDiv, config.name + ' is not in the Gallery yet');
            return;
        }
        let newVersion = pluginInList.version;
        if (newVersion !== config.version) {
            showMsg(
                messageDiv,
                `Please Update to version: <b>${newVersion}</b><br>Uninstall the current version (${config.version}) first and then install version ${newVersion} from the Plugin Gallery.`,
                60000,
            );
        }
    });
}

function toggleFullscreen() {
    let fs =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
    if (fs) closeFullscreen();
    else openFullscreen();
    return !fs;
}

function openFullscreen() {
    const e = document.documentElement;
    if (e.requestFullscreen) {
        e.requestFullscreen();
    } else if (e.webkitRequestFullscreen) {
        /* Safari */
        e.webkitRequestFullscreen();
    } else if (e.msRequestFullscreen) {
        /* IE11 */
        e.msRequestFullscreen();
    }
}

/* Close fullscreen */
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        /* IE11 */
        document.msExitFullscreen();
    }
}

export {
    addDrag,
    showInfo,
    getWrapDiv,
    makeTopLeftHandle,
    makeBottomRightHandle,
    embedForTablet,
    checkVersion,
    showMsg,
    openFullscreen,
    closeFullscreen,
    toggleFullscreen,
};
