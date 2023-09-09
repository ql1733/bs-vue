import { isFunction, isObject } from "../shared/index.js";
import { ShapeFlags } from "../shared/shapeFlag.js";
import { PublicInstanceProxyHandlers } from "./componentPubliceInstance.js"
export function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: {},
        attrs: {},
        slots: {},
        ctx: {},
        setupState: {},
        isMounted: false
    }
    instance.ctx = { _: instance }
    return instance;
}

export function setupComponent(instance) {
    const { props, children } = instance.vnode;
    instance.props = props;
    instance.children = children;
    let flag = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
    if (flag) {
        setupStatefulComponent(instance);
    }
}

function setupStatefulComponent(instance) {
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
    let Component = instance.type;
    let { setup } = Component;
    if (setup) {
        let setupContext = createSetupContext(instance);
        let setupResult = setup(instance.props, setupContext);
        handleSetupResult(instance, setupResult);
    } else {
        finishComponentSetup(instance);
    }

   // Component.render(instance.proxy);
}
function handleSetupResult(instance, setupResult) {
    // console.log(setupResult)
    if (isFunction(setupResult)) {
        instance.render = setupResult;
    } else if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance)
}
function finishComponentSetup(instance) {
    let Component = instance.type;

    if (!instance.render) {
        // 模板编译产生render
        if (!Component.render && Component.template) {

        }
        instance.render = Component.render
    }
}
function createSetupContext(instance) {
    return {
        attrs: instance.attrs,
        props: instance.props,
        slots: instance.slots,
        emit: () => { },
        expose: () => { }
    }
}