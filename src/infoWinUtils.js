function addDrag(el, onDrag) {
    let topMargin = parseInt(getComputedStyle(el)['margin-top']);
    let leftMargin = parseInt(getComputedStyle(el)['margin-left']);
    let top, topOffs, left, leftOffs;
    let mouseDown = false;
    const handleStart = e => {
        e.preventDefault();
        e.stopPropagation();
        top = el.offsetTop - topMargin;
        left = el.offsetLeft - leftMargin;
        let pos = e.targetTouches ? e.targetTouches[0] : e;
        topOffs = top - pos.pageY;
        leftOffs = left - pos.pageX;
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
    const handleMove = e => {
        if (!mouseDown) return;
        let pos = e.targetTouches ? e.targetTouches[0] : e;
        onDrag(leftOffs + pos.pageX, topOffs + pos.pageY);
        el.style.top = topOffs + pos.pageY + 'px';
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

function getWrapDiv() {
    let wrapDiv = document.getElementById('ext-plugin-info-wrapper');
    if (!wrapDiv) {
        wrapDiv = document.createElement('div');
        wrapDiv.id = 'ext-plugin-info-wrapper';
        document.body.appendChild(wrapDiv);
    }
    return wrapDiv;
}

export { addDrag, showInfo, getWrapDiv };