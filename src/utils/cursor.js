var CURSOR;

Math.lerp = (a, b, n) => (1 - n) * a + n * b;

const shouldUseCustomCursor = () => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
        return false;
    }
    return true;
};

class Cursor {
    constructor() {
        this.pos = {
            curr: null,
            prev: null
        };
        this.create();
        this.init();
        this.render();
    }

    move(left, top) {
        this.cursor.style.left = `${left}px`;
        this.cursor.style.top = `${top}px`;
    }

    create() {
        if (!this.cursor) {
            this.cursor = document.createElement("div");
            this.cursor.id = "cursor";
            this.cursor.classList.add("hidden");
            document.body.append(this.cursor);
        }
    }

    init() {
        document.onmousemove = (e) => {
            if (this.pos.curr == null) {
                this.move(e.clientX - 8, e.clientY - 8);
            }
            this.pos.curr = { x: e.clientX - 8, y: e.clientY - 8 };
            this.cursor.classList.remove("hidden");
        };
        document.onmouseenter = () => this.cursor.classList.remove("hidden");
        document.onmouseleave = () => this.cursor.classList.add("hidden");
        document.onmousedown = () => this.cursor.classList.add("active");
        document.onmouseup = () => this.cursor.classList.remove("active");
    }

    render() {
        if (this.pos.prev && this.pos.curr) {
            this.pos.prev.x = Math.lerp(this.pos.prev.x, this.pos.curr.x, 0.35);
            this.pos.prev.y = Math.lerp(this.pos.prev.y, this.pos.curr.y, 0.35);
            this.move(this.pos.prev.x, this.pos.prev.y);
        } else if (this.pos.curr) {
            this.pos.prev = { ...this.pos.curr };
        }
        requestAnimationFrame(() => this.render());
    }
}

const cursorInit = () => {
    if (!shouldUseCustomCursor()) {
        return null;
    }
    if (!CURSOR) {
        CURSOR = new Cursor();
    }
    return CURSOR;
};

export default cursorInit;