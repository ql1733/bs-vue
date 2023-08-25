import { isFunction } from "../shared.js"
import { effect, track, trigger } from "./effect.js";
import { TrackOpTypes, TriggerOrTypes } from "./operators.js";

class ComputedRefImpl {
    _dirty = true;
    _value
    effect
    constructor(getter, setter) {
        this.getter = getter;
        this.setter = setter;
        this.effect = effect(getter, {
            lazy: true,
            scheduler: () => {
                if (!this._dirty) {
                    this._dirty = true;
                    trigger(this,TriggerOrTypes.SET, "value");
                }
            }
        })
    }
    get value() {
        if (this._dirty) {
           this._value =  this.effect();
           this._dirty = false;
        }
        track(this, TrackOpTypes.GET, "value");
        return this._value;
    }
    set value(newValue) {
        this.setter(newValue);
    }
}

export function computed(getterOrOptions) {
    let getter
    let setter
    if(isFunction()) {
        getter = getterOrOptions;
        setter = () => {
            console.warn("computed value must be readonly")
        }
    } else {
        getter = getterOrOptions.set;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
}