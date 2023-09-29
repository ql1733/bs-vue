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
    const unmountChildren = (children) => {
        for(let i = 0; i < children.length;i++) {
            unmount(children[i]);
        }
    }
    const patchKeyedChildren = (c1,c2,el) => {
        let i = 0;
        let e1 = c1.length -1;
        let e2 = c2.length -1;
        while(i<=e1 && i <= e2) {
            let n1 = c1[i];
            let n2 = c2[i];
            if(isSameVNodeType(n1,n2)) {
                patch(n1,n2, el);
            } else {
                break
            }
            i++;
        }
        while(i<=e1 && i <= e2) {
            let n1 = c1[e1];
            let n2 = c2[e2];
            if(isSameVNodeType(n1,n2)) {
                patch(n1,n2, el);
            } else {
                break
            }
            e1--;
            e2--;
        }
        if(i>e1) {
            if(i<e2) {
                let nextPos = e2 +1;
                let anchor = nextPos < c2.length ? c2[nextPos].el: null
                while(i<=e2) {
                    patch(null, c2[i], el,anchor);
                    i++;
                }
            }
        } else if(i>e2) {
            while(i<=e1) {
                unmount(c[i]);
                i++;
            }
        } else {
            let  s1 = i;
            let s2 = i;
            const keyToNewIndexMap = new Map();
            for(let i = s2;i<=e2;i++) {
                let childVNode = c2[i];
                keyToNewIndexMap.set(childVNode.key, i)
            }
            let toBePatched = e2-s2 +1;
            let newIndexToOldIndexMap = new Array(toBePatched).fill(0);

            for(let  i = s1; i<=e1;i++) {
                let oldVNode = c1[i];
                let newIndex = keyToNewIndexMap.get(oldVNode.key);
                if (newIndex === undefined) {
                    unmount(oldVNode);
                }else {
                    newIndexToOldIndexMap[newIndex - s2] = i+1;
                    patch(oldVNode, c2[newIndex], el)
                }
            }
            for(let i = toBePatched-1;i>=0;i--) {
                let currentIndex = i + s2;
                let child = c2[currentIndex];
                let anchor = currentIndex + 1 < c2.length ? c2[currentIndex+1]: null
                if(newIndexToOldIndexMap[i] == 0) {
                    patch(null, child, el, anchor)
                } else {
                    hostInsert(child.el, el,anchor);
                }
            }
        }
    }
    const patchChildren = (n1, n2, el) => {
        let c1 = n1.children;
        let c2 = n2.children;
        let prevShapeFlag = n1.shapeFlag;
        let shapeFlag = n2.shapeFlag;
        if(shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 老的是n 个孩子， 新的是文本
            if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);
            }
            // 两个都是文本
            if (c2 !== c1) {
                hostSetElementText(el, c2);
            }
        } else {
            // 现在1是元素 上次是文本或 数组
            if(prevShapeFlag &ShapeFlags.ARRAY_CHILDREN) {
                if(shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    patchKeyedChildren(c1,c2,el);
                } else {
                    unmountChildren(c1);
                }
            } else {
                // 上次是文本
                if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(el, "");
                } 
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el);
                }
            }
        }

    }
    const patchElement = (n1, n2, container) => {
        // 元素是相同节点
        let el = (n2.el = n1.el);
        let oldProps = n1.props || {};
        let newProps = n2.props || {};
        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el);
    }
    const processElement = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountElement(n2, container, anchor);
        } else {
            patchElement(n1,n2, container)
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