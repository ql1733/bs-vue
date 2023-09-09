import { ShapeFlags } from "../shared/shapeFlag.js";
import { createAppAPI } from "./apiCreateApp.js"
import { createComponentInstance, setupComponent } from "./component.js";
import { effect } from "../reactivity/effect.js";
import { normailzeVNode } from "./vnode.js";
import { queueJob } from "./scheduler.js";
export function createRenderer(rendererOptions) {
    const {
        insert: hostInsert,
        remove: hostRemove,
        patchProp: hostPatchProp,
        createElement: hostCreateElement,
        createText: hostCreateText,
        createComment: hostCreateComment,
        setText: hostSetText,
        setElementText: hostSetElementText,
        nextSibling: hostNextSibling
    } = rendererOptions;
    const setupRenderEffect = (instance, container) => {
       instance.update = effect(function componentEffect() {
            if (!instance.isMounted) {
                let proxy = instance.proxy;
                let subTree = instance.subTree = instance.render.call(proxy, proxy);
                patch(null, subTree, container);
                instance.isMounted = true;
            } else {
                // 更新
                let prevTree = instance.subTree;
                let proxy = instance.proxy;
                let nextTree = instance.render.call(proxy, proxy);
                patch(prevTree, nextTree, container)
            }
        }, {
            scheduler: queueJob
        })
    }
    const mountComponent = (n, container) => {
        // 组件渲染流程 调用setup 拿到返回值，获取render 函数返回值进行渲染
        // 获取实例
        const instance = (n.component = createComponentInstance(n));
        // 解析需要数据到实例上面
        setupComponent(instance);
        // 创建 一个effect 让render 执行
        setupRenderEffect(instance, container);
    }
    const processComponent = (n1, n2, container) => {
        if (n1 == null) {
            mountComponent(n2, container)
        }
    }
    const mountChildren = (children, el) => {
        for(let i = 0; i < children.length; i++) {
            let child = normailzeVNode(children[i]);
            patch(null, child, el);
        }
    }
    const mountElement = (vnode, container, anchor=null) => {
        const { props, shapeFlag, type, children } = vnode;
        let el = vnode.el = hostCreateElement(type);
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        hostInsert(el, container, anchor);
    }
    const patchProps = (oldProps, newProps, el) => {
        if (oldProps !== newProps) {
            for(let key in newProps) {
                let prev = oldProps[key];
                let next = newProps[key];
                if(prev !== next) {
                    hostPatchProp(el, key, prev, next);
                }
            }
            for(let key in oldProps) {
                if (!(key in newProps)) {
                    hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    const patchChildren = (n1, n2, container) => {
        let c1 = n1.children;
        let c2 = n2.children;

    }
    const pathElement = (n1, n2, container) => {
        // 元素是相同节点
        let el = (n2.el = n1.el);
        let oldProps = n1.props || {};
        let newProps = n2.props || {};
        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, container);
    }
    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountElement(n2, container, anchor);
        } else {
            pathElement(n1,n2, container)
        }
    }
    const processText = (n1, n2, container) => {
        if (n1 == null) {
            hostInsert(n2.el = hostCreateText(n2.children),container);
        }
    }
    const isSameVNodeType = (n1, n2) => {
        return n1.type === n2.type && n1.key === n2.key;
    }
    const unmount = (n) => {
        hostRemove(n);
       
    }
    const patch = (n1, n2, container, anchor=null) => {

        const { shapeFlag, type } = n2;
        if (n1 && !isSameVNodeType(n1, n2)) {
            anchor = hostNextSibling(n1.el)
            unmount(n1)
            n1 = null;
        }
        switch(type) {
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container,anchor);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container);
                }
        }
        

    }
    const render = (vnode, container) => {
        patch(null, vnode, container);
    }
    return {
        createApp: createAppAPI(render)
    }

}