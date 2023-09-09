
import { patchAttr } from "./attr.js"
import { patchClass } from "./class.js";
import { patchEvents } from "./events.js";
import { patchStyle } from "./style.js";
export const patchProp = (el, key, prevValue, nextValue) => {
    switch(key) {
        case "class":
            patchClass(el, nextValue);
            break;
        case "style":
            patchStyle(el, prevValue, nextValue)
            break;
        default:
            //事件
            if (/^on[^a-z]/.test(key)) {
                patchEvents(el, key, nextValue)
            } else {
                patchAttr(el, key, nextValue);
            }
            break
    }
}