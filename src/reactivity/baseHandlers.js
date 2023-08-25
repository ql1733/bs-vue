import { hasChange, hasOwn, isArray, isIntegerKey, isObject } from "../shared/index.js"
import { reactive, readonly } from "./reactive.js"
import { track, trigger} from "./effect.js"
import { TrackOpTypes, TriggerOrTypes } from "./operators.js"

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver){
        const res = Reflect.get(target, key, receiver)
        if (!isReadonly) {
            // 不是只读 收集依赖
            track(target, TrackOpTypes.GET,key)
        }
        if(shallow) {
            // 浅的，只有最外面一层 直接返回
            return res
        }
        if (isObject(res)) {
            // 是对象 
            return isReadonly ? readonly(res) : reactive(res)
        }
        return res
    }
}
function createSetter(isReadonly = false) {
    return function set(target, key, value, receiver){
        const oldValue = target[key]
        // 数组索引修改， 对象属性修改
        let hasKey =  isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key)
        const res = Reflect.set(target, key, value, receiver)
        if (!hasKey) {
            // 新增
            trigger(target, TriggerOrTypes.ADD, key, value)
        } else if (hasChange(oldValue, value)){
            // 修改
            trigger(target, TriggerOrTypes.SET, key, value, oldValue)
        }
        return res
    }
}
const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)
const set = createSetter()
const shallowSet = createGetter(true)

export const mutableHandlers = {
    get,
    set
}
export const shallowReactiveHandlers = {
    get: shallowGet,
    set: shallowSet
}
// 只读不能设置
let readonlyObj = {
    set: (target, key) => {
        console.warn(`set ${target} on ${key} fail `)
    }
}

export const readonlyHandlers = Object.assign({
    get: readonlyGet
}, readonlyObj)

export const shallowReadonlyHandlers = Object.assign({
    get: shallowReadonlyGet
}, readonlyObj)