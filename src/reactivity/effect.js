import { isArray, isIntegerKey } from "../shared/index.js"
import { TriggerOrTypes } from "./operators.js"


export function effect(fn, options) {
    const effect = createReactiveEffect(fn, options={})
    if(!options.lazy) {
        effect()
    }
    return effect
}
let uid = 0
let activeEffect 
let effectStack = []
function createReactiveEffect(fn, options) {
    const effect = function reactiveEffect() {
        if (!effectStack.includes(effect)) {
            try{
                effectStack.push(effect)
                activeEffect = effect
                return fn()
            }finally {
                effectStack.pop()
                activeEffect = effectStack[effectStack.length-1]
            }
        }
    }
    effect.id = uid++
    effect._isEffect = true
    effect.raw = fn
    effect.options = options
    return effect
}
let targetMap = new WeakMap()
export function track(target,type, key) {
    if (!activeEffect) return
    // target {name: "vs",age: 18}
    // target => name => new Map
    // map(name) => new Set
    // set => [effect] 
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap= new Map))
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep= new Set))
    }
    if(!dep.has(activeEffect)) {
        dep.add(activeEffect)
    }
}

export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    // 没有搜集过，不用更新
    if (!depsMap) return
    const effects = new Set();
    const add = (effectsToAdd) => {
        if(effectsToAdd) {
            effectsToAdd.forEach(effect => effects.add(effect))
        }
    }
    // 修改数组长度
    if(key === "length" && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key === "length" || key > oldValue) {
                // 更改的数组长度小于收集的索引 更新
                add(dep)
            }
        })
    } else {
        if(key!==undefined) {
            add(depsMap.get(key))
        }
         // 修改数组索引
        switch(type) {
            case TriggerOrTypes.ADD:
                // 触发数组索引更新
                if(isArray(target) && isIntegerKey(key)) {
                    add(depsMap.get("length"))
                }
        }
    }
    effects.forEach(effect=> {
        if (effect.options.schedules) {
            effect.options.scheduler(effect);
        } else {
            effect();
        }
    })
}