
import { nodeOps } from "./nodeOps.js";
import { patchProp } from "./patchProp.js";
import { createRenderer } from "../runtime-core/index.js";
const rendererOptions = Object.assign({ patchProp }, nodeOps);


export function createApp(rootComponent, rootProps = null) {
    const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps)
    const { mount } = app;
    app.mount = function (container) {
        container = nodeOps.querySelector(container);
        container.innerHTML = "";
        mount(container);
    }
    return app;
}
