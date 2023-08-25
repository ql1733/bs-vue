
import { isObject } from "../shared/index.js"
import {
    mutableHandlers,
    shallowReactiveHandlers,
    readonlyHandlers,
    shallowReadonlyHandlers
} from "./baseHandlers.js"
export function reactive(target) {
    return createReactiveObject(target, false, mutableHandlers)
}
export function shallowReactive(target) {
    return createReactiveObject(target, false, shallowReactiveHandlers)
}
export function readonly(target) {
    return createReactiveObject(target, true, readonlyHandlers)
}
export function shallowReadonly(target){
    return createReactiveObject(target, true, shallowReadonlyHandlers)
}

const reactiveMap = new WeakMap()
const readonlyMap = new WeakMap()
export function createReactiveObject(target, isReadonly, baseHnadlers){
    
    if(!isObject(target)) {
        return target
    }
    const proxyMap = isReadonly ? readonlyMap : reactiveMap
    const existProxy = proxyMap.get(target)
    if (existProxy) {
        return existProxy
    }
    const proxy = new Proxy(target, baseHnadlers)
    proxyMap.set(target, proxy)
    return proxy
}