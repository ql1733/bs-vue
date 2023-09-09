

function typeOf(o) {
    return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
}
export function isObject(o) {
    return typeOf(o) === "object";
}
export function isArray(o) {
    return typeOf(o) === "array";
}
export function isFunction(o) {
    return typeOf(o) === "function";
}
export function isNumber(o) {
    return typeOf(o) === "number";
}
export function isString(o) {
    return typeOf(o) === "string"
}
export function isIntegerKey(key) {
    return parseInt(key) + "" === key;
}
export function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}
export function hasChange(o, n) {
    return o !== n;
}
export * from "./shapeFlag.js"