
const globalCss = `<style id='stylesheet-for-windy-plugin-rings'>.onwindy-plugin-rings.onwindy-plugin-rings-info #search{display:none}.onwindy-plugin-rings.onwindy-plugin-rings-info #plugin-developer-mode{left:400px}#windy-plugin-rings-info{display:none}.onwindy-plugin-rings.onwindy-plugin-rings-info #windy-plugin-rings-info{display:block}.ondetail #windy-plugin-rings-info{display:none !important}.onrplanner #windy-plugin-rings-info{display:none !important}</style>`;
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
