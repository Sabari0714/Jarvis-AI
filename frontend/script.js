// ============================================================
// ROLEX AI — UNIVERSAL LOCAL BRAIN v2
// NO API • NO GEMINI • NO OPENAI
// Maths • Engineering • Physics • Conversion • Memory • Voice
// ============================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendButton = document.getElementById("send");
const voiceButton = document.getElementById("voiceButton");

let memory = JSON.parse(localStorage.getItem("rolex_memory") || "{}");

// ============================================================
// UI
// ============================================================

function escapeHTML(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function addMessage(sender, text) {
    if (!chat) return;

    const row = document.createElement("div");

    row.className =
        sender === "YOU"
            ? "message user-message"
            : "message rolex-message";

    row.innerHTML = `
        <strong>${sender}</strong>
        <span>${escapeHTML(text)}</span>
    `;

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

// ============================================================
// MEMORY
// ============================================================

function saveMemory(key, value) {
    memory[key.toLowerCase()] = value;
    localStorage.setItem("rolex_memory", JSON.stringify(memory));
}

function clearMemory() {
    memory = {};
    localStorage.removeItem("rolex_memory");
}

// ============================================================
// NUMBER FORMAT
// ============================================================

function fmt(n) {
    if (!Number.isFinite(n)) return "undefined";

    if (Math.abs(n) < 1e-12) n = 0;

    return Number(n.toFixed(12)).toString();
}

// ============================================================
// SAFE MATH EXPRESSION ENGINE
// Supports:
// + - * / % ^
// sqrt, cbrt, sin, cos, tan
// asin, acos, atan
// log, ln, exp, abs
// pi, e
// ============================================================

const FUNCTIONS = {
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    log: Math.log10,
    ln: Math.log,
    exp: Math.exp
};

function normalizeExpression(exp) {

    exp = exp
        .toLowerCase()
        .replaceAll("π", "pi")
        .replaceAll("×", "*")
        .replaceAll("÷", "/")
        .replaceAll("−", "-")
        .replace(/\s+/g, " ");

    exp = exp
        .replace(/\bto the power of\b/g, "^")
        .replace(/\bpower of\b/g, "^")
        .replace(/\bsquared\b/g, "^2")
        .replace(/\bcubed\b/g, "^3")
        .replace(/\bmultiplied by\b/g, "*")
        .replace(/\bmultiply by\b/g, "*")
        .replace(/\bdivided by\b/g, "/")
        .replace(/\bdivide by\b/g, "/")
        .replace(/\bplus\b/g, "+")
        .replace(/\bminus\b/g, "-")
        .replace(/\btimes\b/g, "*")
        .replace(/\binto\b/g, "*");

    exp = exp
        .replace(/கூட்டல்/g, "+")
        .replace(/கூட்டு/g, "+")
        .replace(/கழித்தல்/g, "-")
        .replace(/கழி/g, "-")
        .replace(/பெருக்கல்/g, "*")
        .replace(/பெருக்கு/g, "*")
        .replace(/வகுத்தல்/g, "/")
        .replace(/வகுக்கு/g, "/");

    return exp;
}

function tokenize(exp) {

    const tokens = [];
    let i = 0;

    while (i < exp.length) {

        const ch = exp[i];

        if (ch === " ") {
            i++;
            continue;
        }

        if (/[0-9.]/.test(ch)) {

            let num = "";

            while (
                i < exp.length &&
                /[0-9.eE+-]/.test(exp[i])
            ) {

                if (
                    (exp[i] === "+" || exp[i] === "-") &&
                    num.length &&
                    !/[eE]$/.test(num)
                ) break;

                num += exp[i];
                i++;
            }

            if (!Number.isFinite(Number(num))) {
                throw new Error("Invalid number");
            }

            tokens.push({
                type: "number",
                value: Number(num)
            });

            continue;
        }

        if (/[a-z]/i.test(ch)) {

            let word = "";

            while (
                i < exp.length &&
                /[a-z]/i.test(exp[i])
            ) {
                word += exp[i];
                i++;
            }

            tokens.push({
                type: "word",
                value: word.toLowerCase()
            });

            continue;
        }

        if ("+-*/%^(),".includes(ch)) {

            tokens.push({
                type: "operator",
                value: ch
            });

            i++;
            continue;
        }

        throw new Error("Invalid character");
    }

    return tokens;
}

function evaluateExpression(expression, degrees = false) {

    let exp = normalizeExpression(expression);

    const tokens = tokenize(exp);

    let pos = 0;

    function peek() {
        return tokens[pos];
    }

    function consume() {
        return tokens[pos++];
    }

    function primary() {

        const t = peek();

        if (!t) throw new Error("Expected value");

        if (t.type === "operator" && t.value === "+") {
            consume();
            return primary();
        }

        if (t.type === "operator" && t.value === "-") {
            consume();
            return -primary();
        }

        if (t.type === "number") {
            consume();
            return t.value;
        }

        if (t.type === "word") {

            const word = t.value;
            consume();

            if (word === "pi") return Math.PI;
            if (word === "e") return Math.E;

            if (FUNCTIONS[word]) {

                if (
                    !peek() ||
                    peek().value !== "("
                ) {
                    throw new Error("Function requires value");
                }

                consume();

                let value = expressionLevel();

                if (
                    !peek() ||
                    peek().value !== ")"
                ) {
                    throw new Error("Missing )");
                }

                consume();

                if (
                    degrees &&
                    ["sin", "cos", "tan"].includes(word)
                ) {
                    value = value * Math.PI / 180;
                }

                let result = FUNCTIONS[word](value);

                if (
                    degrees &&
                    ["asin", "acos", "atan"].includes(word)
                ) {
                    result = result * 180 / Math.PI;
                }

                return result;
            }

            throw new Error("Unknown word");
        }

        if (
            t.type === "operator" &&
            t.value === "("
        ) {

            consume();

            const value = expressionLevel();

            if (
                !peek() ||
                peek().value !== ")"
            ) {
                throw new Error("Missing )");
            }

            consume();

            return value;
        }

        throw new Error("Expected value");
    }

    function power() {

        let left = primary();

        while (
            peek() &&
            peek().value === "^"
        ) {

            consume();

            const right = primary();

            left = Math.pow(left, right);
        }

        return left;
    }

    function term() {

        let left = power();

        while (
            peek() &&
            ["*", "/", "%"].includes(peek().value)
        ) {

            const op = consume().value;
            const right = power();

            if (op === "*") left *= right;

            if (op === "/") {
                if (right === 0) throw new Error("Division by zero");
                left /= right;
            }

            if (op === "%") left %= right;
        }

        return left;
    }

    function expressionLevel() {

        let left = term();

        while (
            peek() &&
            ["+", "-"].includes(peek().value)
        ) {

            const op = consume().value;
            const right = term();

            if (op === "+") left += right;
            else left -= right;
        }

        return left;
    }

    const result = expressionLevel();

    if (pos < tokens.length) {
        throw new Error("Unexpected input");
    }

    if (!Number.isFinite(result)) {
        throw new Error("Invalid result");
    }

    return result;
}

// ============================================================
// LINEAR EQUATION
// ax + b = c
// ============================================================

function solveLinearEquation(text) {

    let s = text
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/−/g, "-");

    if (!s.includes("=") || !s.includes("x")) {
        return null;
    }

    const sides = s.split("=");

    if (sides.length !== 2) return null;

    function coefficients(side) {

        side = side
            .replace(/-/g, "+-")
            .replace(/^\+/, "");

        const terms = side.split("+");

        let a = 0;
        let b = 0;

        for (let term of terms) {

            if (!term) continue;

            if (term.includes("x")) {

                let coefficient =
                    term.replace("x", "");

                if (
                    coefficient === "" ||
                    coefficient === "+"
                ) coefficient = "1";

                if (coefficient === "-") {
                    coefficient = "-1";
                }

                a += Number(coefficient);

            } else {

                b += Number(term);
            }
        }

        return { a, b };
    }

    const L = coefficients(sides[0]);
    const R = coefficients(sides[1]);

    const a = L.a - R.a;
    const b = R.b - L.b;

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return null;
    }

    if (a === 0) {
        if (b === 0) return "Infinite solutions.";
        return "No solution.";
    }

    return `x = ${fmt(b / a)}`;
}

// ============================================================
// QUADRATIC
// ax² + bx + c = 0
// ============================================================

function solveQuadratic(text) {

    const s = text
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/²/g, "^2");

    if (
        !s.includes("x^2") ||
        !s.includes("=")
    ) return null;

    const sides = s.split("=");

    if (sides.length !== 2) return null;

    let expr = sides[0] + "-(" + sides[1] + ")";

    expr = expr.replace(/^\((.*)\)$/, "$1");

    let aMatch = expr.match(/([+-]?\d*\.?\d*)x\^2/);
    let bMatch = expr.match(/([+-]?\d*\.?\d*)x(?!\^)/);

    if (!aMatch) return null;

    let a = aMatch[1];

    if (a === "" || a === "+") a = 1;
    if (a === "-") a = -1;

    a = Number(a);

    let b = bMatch ? bMatch[1] : "0";

    if (b === "" || b === "+") b = 1;
    if (b === "-") b = -1;

    b = Number(b);

    let constant = expr
        .replace(aMatch[0], "")
        .replace(bMatch ? bMatch[0] : "", "");

    constant = constant.replace(/[()]/g, "");

    let c = Number(constant);

    if (!Number.isFinite(a + b + c)) return null;

    const d = b * b - 4 * a * c;

    if (d < 0) {
        return "No real roots.";
    }

    if (d === 0) {
        return `x = ${fmt(-b / (2 * a))}`;
    }

    const x1 = (-b + Math.sqrt(d)) / (2 * a);
    const x2 = (-b - Math.sqrt(d)) / (2 * a);

    return `x₁ = ${fmt(x1)}, x₂ = ${fmt(x2)}`;
}

// ============================================================
// BASIC MATH
// ============================================================

function percentageOf(text) {

    let m = text.match(
        /([\d.]+)\s*%\s*(?:of|from)\s*([\d.]+)/i
    );

    if (!m) return null;

    return Number(m[1]) * Number(m[2]) / 100;
}

function percentageChange(text) {

    let m = text.match(
        /percentage\s+change\s+(?:from\s+)?([\d.]+)\s+(?:to|into)\s+([\d.]+)/i
    );

    if (!m) return null;

    const oldValue = Number(m[1]);
    const newValue = Number(m[2]);

    if (oldValue === 0) return null;

    return ((newValue - oldValue) / oldValue) * 100;
}

function average(text) {

    let m = text.match(
        /(?:average|mean)\s+(?:of\s+)?(.+)/i
    );

    if (!m) return null;

    const nums = m[1]
        .match(/-?\d+(?:\.\d+)?/g)
        ?.map(Number);

    if (!nums || nums.length === 0) return null;

    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ============================================================
// GEOMETRY
// ============================================================

function geometry(text) {

    let m;

    m = text.match(
        /area\s+of\s+(?:a\s+)?circle\s+(?:radius\s+)?([\d.]+)/i
    );

    if (m) {
        const r = Number(m[1]);
        return `Circle area = ${fmt(Math.PI * r * r)}`;
    }

    m = text.match(
        /circumference\s+(?:of\s+)?(?:a\s+)?circle\s+(?:radius\s+)?([\d.]+)/i
    );

    if (m) {
        const r = Number(m[1]);
        return `Circle circumference = ${fmt(2 * Math.PI * r)}`;
    }

    m = text.match(
        /area\s+(?:of\s+)?(?:a\s+)?rectangle\s+([\d.]+)\s+(?:by|x)\s+([\d.]+)/i
    );

    if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);

        return `Rectangle area = ${fmt(a * b)}`;
    }

    m = text.match(
        /perimeter\s+(?:of\s+)?(?:a\s+)?rectangle\s+([\d.]+)\s+(?:by|x)\s+([\d.]+)/i
    );

    if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);

        return `Rectangle perimeter = ${fmt(2 * (a + b))}`;
    }

    m = text.match(
        /triangle\s+area\s+([\d.]+)\s+([\d.]+)/i
    );

    if (m) {
        return `Triangle area = ${fmt(
            0.5 * Number(m[1]) * Number(m[2])
        )}`;
    }

    m = text.match(
        /sphere\s+volume\s+(?:radius\s+)?([\d.]+)/i
    );

    if (m) {
        const r = Number(m[1]);

        return `Sphere volume = ${fmt(
            4 / 3 * Math.PI * r ** 3
        )}`;
    }

    m = text.match(
        /cylinder\s+volume\s+([\d.]+)\s+([\d.]+)/i
    );

    if (m) {
        const r = Number(m[1]);
        const h = Number(m[2]);

        return `Cylinder volume = ${fmt(
            Math.PI * r * r * h
        )}`;
    }

    return null;
}

// ============================================================
// ELECTRICAL / ELECTRONICS
// ============================================================

function electrical(text) {

    let m;

    // V = I R
    m = text.match(
        /(?:voltage|volt|v)\s*(?:=|is)?\s*([\d.]+)\s*(?:amp|amps|a)\s*(?:and|with|x|\*)\s*([\d.]+)\s*(?:ohm|ohms|r)/i
    );

    if (m) {
        const I = Number(m[1]);
        const R = Number(m[2]);

        return `Voltage V = ${fmt(I * R)} V`;
    }

    m = text.match(
        /(?:current|amp|amps|i)\s*(?:=|is)?\s*([\d.]+)\s*(?:volt|volts|v)\s*(?:\/|divided by)\s*([\d.]+)\s*(?:ohm|ohms|r)/i
    );

    if (m) {
        return `Current I = ${fmt(
            Number(m[1]) / Number(m[2])
        )} A`;
    }

    m = text.match(
        /(?:resistance|resistor|r)\s*(?:=|is)?\s*([\d.]+)\s*(?:volt|volts|v)\s*(?:\/|divided by)\s*([\d.]+)\s*(?:amp|amps|a)/i
    );

    if (m) {
        return `Resistance R = ${fmt(
            Number(m[1]) / Number(m[2])
        )} Ω`;
    }

    // Power
    m = text.match(
        /(?:power|watt|watts)\s*(?:=|is)?\s*([\d.]+)\s*(?:volt|volts|v)\s*(?:x|\*|times)\s*([\d.]+)\s*(?:amp|amps|a)/i
    );

    if (m) {
        return `Power P = ${fmt(
            Number(m[1]) * Number(m[2])
        )} W`;
    }

    // kWh
    m = text.match(
        /energy\s+([\d.]+)\s*(?:kw)\s*(?:for|x|times)\s*([\d.]+)\s*(?:hour|hours|h)/i
    );

    if (m) {
        return `Energy = ${fmt(
            Number(m[1]) * Number(m[2])
        )} kWh`;
    }

    // Series resistance
    m = text.match(
        /series\s+resistance\s+(.+)/i
    );

    if (m) {

        const nums = m[1]
            .match(/[\d.]+/g)
            ?.map(Number);

        if (nums?.length) {
            return `Series resistance = ${fmt(
                nums.reduce((a, b) => a + b, 0)
            )} Ω`;
        }
    }

    // Parallel resistance
    m = text.match(
        /parallel\s+resistance\s+(.+)/i
    );

    if (m) {

        const nums = m[1]
            .match(/[\d.]+/g)
            ?.map(Number);

        if (nums?.length) {

            const inv = nums.reduce(
                (sum, x) => sum + 1 / x,
                0
            );

            return `Parallel resistance = ${fmt(1 / inv)} Ω`;
        }
    }

    return null;
}

// ============================================================
// PHYSICS
// ============================================================

function physics(text) {

    let m;

    // F = ma
    m = text.match(
        /force\s+([\d.]+)\s*(?:kg|kilogram|mass)?\s*(?:x|\*|times)\s*([\d.]+)\s*(?:m\/s2|m\/s²|acceleration)/i
    );

    if (m) {
        return `Force F = ${fmt(
            Number(m[1]) * Number(m[2])
        )} N`;
    }

    // weight
    m = text.match(
        /weight\s+(?:of\s+)?([\d.]+)\s*(?:kg|kilogram)/i
    );

    if (m) {
        return `Weight = ${fmt(
            Number(m[1]) * 9.80665
        )} N`;
    }

    // pressure
    m = text.match(
        /pressure\s+([\d.]+)\s*(?:n|newton)\s*(?:\/|per)\s*([\d.]+)\s*(?:m2|m²)/i
    );

    if (m) {
        return `Pressure = ${fmt(
            Number(m[1]) / Number(m[2])
        )} Pa`;
    }

    // density
    m = text.match(
        /density\s+([\d.]+)\s*(?:kg)?\s*(?:\/|per)\s*([\d.]+)\s*(?:m3|m³)/i
    );

    if (m) {
        return `Density = ${fmt(
            Number(m[1]) / Number(m[2])
        )} kg/m³`;
    }

    // speed
    m = text.match(
        /speed\s+([\d.]+)\s*(?:km|kmh|km\/h)\s*(?:\/|per)\s*([\d.]+)\s*(?:hour|h)/i
    );

    if (m) {
        return `Speed = ${fmt(
            Number(m[1]) / Number(m[2])
        )} km/h`;
    }

    // kinetic energy
    m = text.match(
        /kinetic\s+energy\s+([\d.]+)\s*(?:kg)?\s*(?:x|\*)\s*([\d.]+)\s*(?:m\/s|velocity)/i
    );

    if (m) {
        const mass = Number(m[1]);
        const velocity = Number(m[2]);

        return `Kinetic Energy = ${fmt(
            0.5 * mass * velocity * velocity
        )} J`;
    }

    // work
    m = text.match(
        /work\s+([\d.]+)\s*(?:n|newton)\s*(?:x|\*|times)\s*([\d.]+)\s*(?:m|meter)/i
    );

    if (m) {
        return `Work = ${fmt(
            Number(m[1]) * Number(m[2])
        )} J`;
    }

    // torque
    m = text.match(
        /torque\s+([\d.]+)\s*(?:n|newton)\s*(?:x|\*|times)\s*([\d.]+)\s*(?:m|meter)/i
    );

    if (m) {
        return `Torque = ${fmt(
            Number(m[1]) * Number(m[2])
        )} N·m`;
    }

    return null;
}

// ============================================================
// UNIT CONVERSION
// ============================================================

const UNIT_TABLE = {

    length: {
        mm: 0.001,
        cm: 0.01,
        m: 1,
        km: 1000,
        inch: 0.0254,
        in: 0.0254,
        ft: 0.3048,
        yard: 0.9144,
        mile: 1609.344
    },

    mass: {
        mg: 0.000001,
        g: 0.001,
        kg: 1,
        tonne: 1000,
        lb: 0.45359237
    },

    speed: {
        "m/s": 1,
        "km/h": 1 / 3.6,
        mph: 0.44704
    },

    pressure: {
        pa: 1,
        kpa: 1000,
        mpa: 1000000,
        bar: 100000,
        psi: 6894.757293,
        atm: 101325
    },

    energy: {
        j: 1,
        kj: 1000,
        mj: 1000000,
        wh: 3600,
        kwh: 3600000,
        cal: 4.184,
        kcal: 4184
    },

    power: {
        w: 1,
        kw: 1000,
        mw: 1000000,
        hp: 745.699872
    }
};

function conversion(text) {

    let m = text.match(
        /(-?\d+(?:\.\d+)?)\s*([a-zA-Z/]+)\s*(?:to|in)\s*([a-zA-Z/]+)/i
    );

    if (!m) return null;

    const value = Number(m[1]);

    let from = m[2].toLowerCase();
    let to = m[3].toLowerCase();

    // temperature
    if (
        ["c", "celsius"].includes(from) &&
        ["f", "fahrenheit"].includes(to)
    ) {
        return `${fmt(value * 9 / 5 + 32)} °F`;
    }

    if (
        ["f", "fahrenheit"].includes(from) &&
        ["c", "celsius"].includes(to)
    ) {
        return `${fmt((value - 32) * 5 / 9)} °C`;
    }

    if (
        ["c", "celsius"].includes(from) &&
        ["k", "kelvin"].includes(to)
    ) {
        return `${fmt(value + 273.15)} K`;
    }

    if (
        ["k", "kelvin"].includes(from) &&
        ["c", "celsius"].includes(to)
    ) {
        return `${fmt(value - 273.15)} °C`;
    }

    for (const category of Object.keys(UNIT_TABLE)) {

        const table = UNIT_TABLE[category];

        if (
            Object.prototype.hasOwnProperty.call(table, from) &&
            Object.prototype.hasOwnProperty.call(table, to)
        ) {

            const base = value * table[from];
            const result = base / table[to];

            return `${fmt(result)} ${to}`;
        }
    }

    return null;
}

// ============================================================
// INTEREST / FINANCE MATH
// ============================================================

function finance(text) {

    let m;

    // SI = PRT / 100
    m = text.match(
        /simple\s+interest\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i
    );

    if (m) {

        const P = Number(m[1]);
        const R = Number(m[2]);
        const T = Number(m[3]);

        const SI = P * R * T / 100;

        return `Simple Interest = ${fmt(SI)}\nAmount = ${fmt(P + SI)}`;
    }

    // compound
    m = text.match(
        /compound\s+interest\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i
    );

    if (m) {

        const P = Number(m[1]);
        const R = Number(m[2]);
        const T = Number(m[3]);

        const A = P * Math.pow(1 + R / 100, T);

        return `Compound Amount = ${fmt(A)}\nInterest = ${fmt(A - P)}`;
    }

    return null;
}

// ============================================================
// COMMAND PROCESSOR
// ============================================================

function processCommand(rawCommand) {

    const command = rawCommand.trim();
    const c = command.toLowerCase();

    // ---------------- GREETING ----------------

    if (
        /^(hello|hi|hey|vanakkam|வணக்கம்)(\s+rolex)?$/i.test(command)
    ) {
        return "Vanakkam Boss. Rolex AI is online.";
    }

    // ---------------- STATUS ----------------

    if (
        c === "status" ||
        c === "system" ||
        c.includes("system status")
    ) {
        return "ROLEX CORE: ONLINE\nLOCAL BRAIN: READY\nMEMORY: READY\nVOICE: STANDBY\nEXTERNAL AI: DISCONNECTED";
    }

    // ---------------- IDENTITY ----------------

    if (
        c.includes("who are you") ||
        c.includes("what are you") ||
        c.includes("nee yaar")
    ) {
        return "I am Rolex AI, your personal local intelligence system.";
    }

    // ---------------- ONLINE ----------------

    if (
        c === "online" ||
        c.includes("are you online")
    ) {
        return "Yes Boss. Rolex AI is online and running locally.";
    }

    // ---------------- HELP ----------------

    if (c === "help" || c === "/help") {

        return `ROLEX LOCAL COMMANDS:

Math:
• 25*4
• sqrt(144)
• 2^10
• sin(30)
• average 10 20 30
• 25% of 800

Equations:
• 2x+5=15
• x^2+5x+6=0

Geometry:
• area of circle radius 5
• rectangle area 10 x 20
• sphere volume 5

Engineering:
• voltage 2 amp x 10 ohm
• power 230 volt x 5 amp
• force 10 kg x 5 m/s2
• torque 20 newton x 3 meter

Conversion:
• 10 km to m
• 100 c to f
• 1 kwh to j

Memory:
• remember my name is Boss
• what is my name
• memory
• clear memory`;
    }

    // ---------------- TIME ----------------

    if (
        c === "time" ||
        c.includes("what time") ||
        c.includes("current time") ||
        c.includes("neram")
    ) {
        return "Local time: " +
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
    }

    // ---------------- DATE ----------------

    if (
        c === "date" ||
        c.includes("what date") ||
        c.includes("today") ||
        c.includes("indha naal")
    ) {
        return "Today is " +
            new Date().toLocaleDateString([], {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
    }

    // ========================================================
    // MEMORY
    // ========================================================

    if (
        c.startsWith("remember ") ||
        c.startsWith("remember that ")
    ) {

        let text = command
            .replace(/^remember that /i, "")
            .replace(/^remember /i, "")
            .trim();

        const match = text.match(
            /^my (.+?) is (.+)$/i
        );

        if (match) {

            const key = match[1].trim();
            const value = match[2].trim();

            saveMemory(key, value);

            return `Okay Boss. I will remember that your ${key} is ${value}.`;
        }

        saveMemory("note", text);

        return "Memory saved locally.";
    }

    if (
        c.includes("what is my") ||
        c.includes("do you remember") ||
        c === "memory" ||
        c === "memories"
    ) {

        const match = command.match(
            /what is my (.+?)[?]*$/i
        );

        if (match) {

            const key = match[1].trim().toLowerCase();

            if (memory[key]) {
                return `Your ${key} is ${memory[key]}.`;
            }

            return `I don't have a saved memory for your ${key}.`;
        }

        const keys = Object.keys(memory);

        if (!keys.length) {
            return "Local memory is currently empty.";
        }

        return "Local memories:\n" +
            keys
                .map(k => `${k} = ${memory[k]}`)
                .join("\n");
    }

    if (
        c === "clear memory" ||
        c === "forget everything" ||
        c === "delete memory"
    ) {

        clearMemory();

        return "Local Rolex memory has been cleared.";
    }

    // ========================================================
    // EQUATIONS
    // ========================================================

    const quadratic = solveQuadratic(command);

    if (quadratic) {
        return `Quadratic solution: ${quadratic}`;
    }

    const linear = solveLinearEquation(command);

    if (linear) {
        return `Equation solution: ${linear}`;
    }

    // ========================================================
    // SPECIAL CALCULATIONS
    // ========================================================

    const percent = percentageOf(command);

    if (percent !== null) {
        return `Percentage result: ${fmt(percent)}`;
    }

    const change = percentageChange(command);

    if (change !== null) {
        return `Percentage change: ${fmt(change)}%`;
    }

    const avg = average(command);

    if (avg !== null) {
        return `Average = ${fmt(avg)}`;
    }

    // ========================================================
    // GEOMETRY
    // ========================================================

    const geo = geometry(command);

    if (geo) return geo;

    // ========================================================
    // ELECTRICAL
    // ========================================================

    const elec = electrical(command);

    if (elec) return elec;

    // ========================================================
    // PHYSICS
    // ========================================================

    const phys = physics(command);

    if (phys) return phys;

    // ========================================================
    // FINANCE
    // ========================================================

    const fin = finance(command);

    if (fin) return fin;

    // ========================================================
    // UNIT CONVERSION
    // ========================================================
    
    const converted = conversion(command);
    if (converted) {
        return `Conversion result: ${converted}`;
    }

    // ========================================================
    // SQRT NATURAL COMMAND
    // ========================================================

    let sqrtMatch = command.match(
        /(?:square root|sqrt)\s+(?:of\s+)?([\d.]+)/i
    );

    if (sqrtMatch) {

        return `√${sqrtMatch[1]} = ${fmt(
            Math.sqrt(Number(sqrtMatch[1]))
        )}`;
    }

    // ========================================================
    // NORMAL MATH
    // ========================================================

    let expression = command
        .replace(/^what is\s+/i, "")
        .replace(/^calculate\s+/i, "")
        .replace(/^calc\s+/i, "")
        .replace(/^answer\s+/i, "")
        .replace(/^solve\s+/i, "")
        .replace(/\?/g, "")
        .trim();

    // Degree mode
    const degrees =
        /\bdegrees?\b|\bdeg\b/i.test(expression);

    expression = expression
        .replace(/\bdegrees?\b/gi, "")
        .replace(/\bdeg\b/gi, "")
        .trim();

    try {

        if (
            /^[0-9a-zA-Zπ+\-*/%^().,\s×÷−]+$/i.test(expression)
        ) {

            const result =
                evaluateExpression(expression, degrees);

            return `Calculation result: ${fmt(result)}`;
        }

    } catch (_) {
        // Not a normal math expression.
    }

    // ========================================================
    // DEFAULT
    // ========================================================

    return "I can process this locally, Boss, but that command is not yet in my formula library. No external AI is connected.";
}

// ============================================================
// SEND
// ============================================================

function sendCommand() {

    if (!input) return;

    const command = input.value.trim();

    if (!command) return;

    addMessage("YOU", command);

    input.value = "";

    const reply = processCommand(command);

    setTimeout(() => {
        addMessage("ROLEX", reply);
    }, 180);
}

if (sendButton) {
    sendButton.addEventListener(
        "click",
        sendCommand
    );
}

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendCommand();
            }
        }
    );
}

// ============================================================
// VOICE
// ============================================================

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {

        if (voiceButton) {

            voiceButton.innerHTML =
                "<span>●</span> LISTENING";

            voiceButton.classList.add(
                "listening"
            );
        }
    };

    recognition.onresult = function(event) {

        const spokenText =
            event.results[0][0].transcript;

        if (input) {
            input.value = spokenText;
        }

        sendCommand();
    };

    recognition.onerror = function() {

        if (voiceButton) {

            voiceButton.innerHTML =
                "<span>●</span> VOICE";

            voiceButton.classList.remove(
                "listening"
            );
        }
    };

    recognition.onend = function() {

        if (voiceButton) {

            voiceButton.innerHTML =
                "<span>●</span> VOICE";

            voiceButton.classList.remove(
                "listening"
            );
        }
    };

    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            function() {

                try {
                    recognition.start();
                } catch (_) {
                    // Prevent duplicate start
                }
            }
        );
    }

} else {

    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            function() {

                addMessage(
                    "ROLEX",
                    "Voice recognition is not supported by this browser."
                );
            }
        );
    }
}

// ============================================================
// STARTUP
// ============================================================

function startup() {

    addMessage(
        "ROLEX",
        "Systems initialized, Boss."
    );

    setTimeout(() => {

        addMessage(
            "ROLEX",
            "Universal Local Brain online. No external AI connected."
        );

    }, 400);
}

startup();
