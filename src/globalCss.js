
const globalCss = `<style id='stylesheet-for-windy-plugin-no-ex'>[data-example-containing-quotes="abc"]{color:red}</style>`;
let globalCssNode;
function insertGlobalCss(){
    if(!document.querySelector("#stylesheet-for-windy-plugin-no-ex")){
        document.head.insertAdjacentHTML('beforeend', globalCss);
        globalCssNode = document.querySelector("#stylesheet-for-windy-plugin-no-ex");
    }
}
function removeGlobalCss(){
    if(globalCssNode){
        globalCssNode.remove();
    }
}
export { globalCssNode, insertGlobalCss, removeGlobalCss };
