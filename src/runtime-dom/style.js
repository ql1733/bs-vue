export const patchStyle = (el, prev, next) => {
    const style = el.style;
    if (next == null) {
        el.removeAttribute("style")
    } else {
        if (prev) {
            for(let key in prev) {
                if(next[key] == null) { // 老大有，新的没有删除
                    style[key] = "";
                }
            }
        }
        // 新值赋值到style
        for (const key in next) {
            style[key] = next[key];
        }
    }
}