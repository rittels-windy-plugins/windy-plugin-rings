/** 
 * @params el: sensitive element
 * @params onDrag: cbf when dragged,  receives:  hor pixel pos in parent, ver pixel pos in parent, and the original position of the parent of the sens element 
 **/

function addDrag(el, onDrag) {
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
        let { offsetTop: pTop, offsetLeft: pLeft, offsetWidth: pWidth, offsetHeight: pHeight } = el.parentElement;
        initialParentPos = { pTop, pLeft, pWidth, pHeight };
        mouseDown = true;
    };
    const handleEnd = () => {
        mouseDown = false;
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('mousemove', handleMove);
    };
    const handleCancel = e => {
        console.log('cancel', e);
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

function showInfo(name) {
    let bdy = document.body;
    if (bdy.classList.contains(`on${name}-info`)) {
        bdy.classList.remove(`on${name}-info`);
    } else {
        bdy.classList.forEach(c => {
            let m = c.match(/onwindy-plugin-.*-info/);
            if (m) bdy.classList.remove(m[0]);
        });
        bdy.classList.add(`on${name}-info`);
    }
}

function makeBottomRightHandle(el, div) {
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
    });
}

function makeTopLeftHandle(el, div) {
    addDrag(el, (x, y, pp) => {
        /** current right edge */
        let cr = div.offsetLeft + div.offsetWidth;
        /** current bottom edge */
        let cb = div.offsetTop + div.offsetHeight;
        let l = pp.pLeft + x,
            t = pp.pTop + y;
        if (l < 1) l = 1;
        if (t < 1) t = 1;
        let r = l + 75, b = t + 75;
        if (r > window.innerWidth) { r = window.innerWidth - 1; l = r - 75 }
        if (b > window.innerHeight) { b = window.innerHeight - 1; t = b - 75 }
        if (r < cr) r = cr;
        if (b < cb) b = cb;
        let w = r - l, h = b - t;
        div.style.left = l + 'px';
        div.style.top = t + 'px';
        div.style.width = w + 'px';
        div.style.height = h + 'px';
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

export { addDrag, showInfo, getWrapDiv, makeTopLeftHandle, makeBottomRightHandle };