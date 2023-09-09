import { isArray, isObject } from "../shared/index.js";
import { createVNode, isVnode } from "./vnode.js";


export function h(type, propsOrChildren, children) {
    const l = arguments.length;
    if (l == 2) { // 类型+属性   类型+children
        if(isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            if(isVnode(propsOrChildren)) {
                return createVNode(type, null, [propsOrChildren])
            }
            return createVNode(type, propsOrChildren)
        } else {
            return createVNode(type, null, propsOrChildren);
        }
    } else {
        if (l >3) {
            children = Array.prototype.slice.call(arguments, 2);
        } else if(l ===3 && isVnode(children)) {
            children = [children];
        }
        return createVNode(type, propsOrChildren, children);
    }
}