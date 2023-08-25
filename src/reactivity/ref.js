
import { hasChange, isArray, isObject } from "../shared/index.js";
import {track, trigger} from "./effect.js"
import { TrackOpTypes, TriggerOrTypes } from "./operators.js";
import {reactive} from "./reactive.js"
export function ref(value) {
    return createRef(value)
}
export function shallowRef(value) {
    return createRef(value, true)
}
const convert = (val) => isObject(val) ? reactive(val): val
class RefImpl {
    _value;
    __v_isRef = true;
     constructor(rawValue, shallow) {
        this._value = shallow ? rawValue:convert(rawValue);
        this.rawValue = rawValue;
        this.shallow = shallow;
     }
     get value() {
        track(this, TrackOpTypes.GET, "value");
        return this._value;
     }
     set value(newValue) {
        if(hasChange(newValue, this.rawValue)) {
            this._value = this.shallow ? newValue: convert(newValue);
            trigger(this, TriggerOrTypes.SET, "value", newValue, this.rawValue);
            this.rawValue = newValue;
        }
     }
}
class ObjectRefImpl {
    __v_isRef = true;
    constructor(target, key) {
        this.target = target;
        this.key = key;
    }
    get value() {
        return this.target[this.key];
    }
    set value(newValue) {
        this.target[this.key] = newValue;
    }
}
function createRef(rawValue, shallow= false) {
    return new RefImpl(rawValue, shallow);
}

export function toRef(target, key) {
    return new ObjectRefImpl(target, key);
}

export function toRefs(object) {
    const res = isArray(object)? new Array(object.length): {};
    for(let key in object) {
        res[key] = toRef(object, key);
    }
    return res;
}