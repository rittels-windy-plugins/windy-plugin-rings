
const globalCss = `<style id='stylesheet-for-windy-plugin-rings'>.onwindy-plugin-rings #plugin-rhpane-top .rhcircle__main-menu__animated-icon span:nth-child(2){transform:rotate(45deg);top:.4em;left:.7em;width:70%}.onwindy-plugin-rings #plugin-rhpane-top .rhcircle__main-menu__animated-icon span:nth-child(3){transform:rotate(-45deg);top:2.1em;left:.7em;width:70%}</style>`;
let globalCssNode;
function insertGlobalCss(){
    if(!document.querySelector("#stylesheet-for-windy-plugin-rings")){
        document.head.insertAdjacentHTML('beforeend', globalCss);
        globalCssNode = document.querySelector("#stylesheet-for-windy-plugin-rings");
    }
}
function removeGlobalCss(){
    if(globalCssNode){
        globalCssNode.remove();
    }
}
export { globalCssNode, insertGlobalCss, removeGlobalCss };
