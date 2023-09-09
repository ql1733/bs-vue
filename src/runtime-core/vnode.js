import { ShapeFlags, isArray, isObject, isString } from "../shared/index.js";

export function isVnode(vnode) {
    return vnode.__v_isVnode;
}
export const createVNode = (type, props, children = null) => {
    const shapeFlag = isString(type) ? ShapeFlags.ELEMENT : isObject(type) ? ShapeFlags.STATEFUL_COMPONENT : 0
    const vnode = {
        __v_isVnode: true,
        type,
        props,
        children,
        el: null,
        component: null,
        render: null,
        key: props && props.key,
        shapeFlag
    }
    normailzeChildren(vnode, children)
    return vnode;
}

function normailzeChildren(vnode, children) {
    let type = 0;
    if (children == null) {

    } else if (isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN;
    } else {
        type = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag = vnode.shapeFlag | type;
}
export const Text = Symbol("Text");
export function normailzeVNode(child) {
    if(isObject(child)) return child;
    return createVNode(Text, null, String(child));
}