// ============================================================
// ROLEX AI — LOCAL BRAIN v3
// NO API • NO GEMINI • NO OPENAI
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
        <span>${escapeHTML(text).replaceAll("\n", "<br>")}</span>
    `;

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

function fmt(n) {
    if (!Number.isFinite(n)) return "undefined";

    if (Math.abs(n) < 1e-12) n = 0;

    return Number(n.toFixed(12)).toString();
}

// ============================================================
// MEMORY
// ============================================================

function saveMemory(key, value) {
    memory[key.toLowerCase()] = value;
    localStorage.setItem(
        "rolex_memory",
        JSON.stringify(memory)
    );
}

function clearMemory() {
    memory = {};
    localStorage.removeItem("rolex_memory");
}

// ============================================================
// SAFE LOCAL MATH ENGINE
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
    ln: Math.log,
    log: Math.log10,
    exp: Math.exp
};

function normalizeExpression(exp) {

    return exp
        .toLowerCase()
        .replaceAll("π", "pi")
        .replaceAll("×", "*")
        .replaceAll("÷", "/")
        .replaceAll("−", "-")
        .replace(/\bmultiplied by\b/g, "*")
        .replace(/\bmultiply by\b/g, "*")
        .replace(/\bdivided by\b/g, "/")
        .replace(/\bdivide by\b/g, "/")
        .replace(/\bplus\b/g, "+")
        .replace(/\bminus\b/g, "-")
        .replace(/\btimes\b/g, "*")
        .replace(/\binto\b/g, "*")
        .replace(/\bto the power of\b/g, "^")
        .replace(/\bpower of\b/g, "^")
        .replace(/\bsquared\b/g, "^2")
        .replace(/\bcubed\b/g, "^3")
        .replace(/\s+/g, " ");
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
                /[0-9.eE]/.test(exp[i])
            ) {
                num += exp[i];
                i++;
            }

            if (
                i < exp.length &&
                (exp[i] === "+" || exp[i] === "-") &&
                /[eE]/.test(num[num.length - 1])
            ) {
                num += exp[i++];
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
                value: word
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

    const tokens = tokenize(
        normalizeExpression(expression)
    );

    let pos = 0;

    function peek() {
        return tokens[pos];
    }

    function consume() {
        return tokens[pos++];
    }

    function primary() {

        const t = peek();

        if (!t) {
            throw new Error("Expected value");
        }

        if (
            t.type === "operator" &&
            t.value === "+"
        ) {
            consume();
            return primary();
        }

        if (
            t.type === "operator" &&
            t.value === "-"
        ) {
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

            if (word === "pi") {
                return Math.PI;
            }

            if (word === "e") {
                return Math.E;
            }

            if (FUNCTIONS[word]) {

                if (
                    !peek() ||
                    peek().value !== "("
                ) {
                    throw new Error(
                        "Function requires parentheses"
                    );
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
                    value =
                        value *
                        Math.PI /
                        180;
                }

                let result =
                    FUNCTIONS[word](value);

                if (
                    degrees &&
                    ["asin", "acos", "atan"].includes(word)
                ) {
                    result =
                        result *
                        180 /
                        Math.PI;
                }

                return result;
            }

            throw new Error(
                "Unknown function"
            );
        }

        if (
            t.type === "operator" &&
            t.value === "("
        ) {

            consume();

            const value =
                expressionLevel();

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

            const right = power();

            left =
                Math.pow(left, right);
        }

        return left;
    }

    function term() {

        let left = power();

        while (
            peek() &&
            ["*", "/", "%"].includes(
                peek().value
            )
        ) {

            const op =
                consume().value;

            const right = power();

            if (op === "*") {
                left *= right;
            }

            if (op === "/") {

                if (right === 0) {
                    throw new Error(
                        "Division by zero"
                    );
                }

                left /= right;
            }

            if (op === "%") {
                left %= right;
            }
        }

        return left;
    }

    function expressionLevel() {

        let left = term();

        while (
            peek() &&
            ["+", "-"].includes(
                peek().value
            )
        ) {

            const op =
                consume().value;

            const right = term();

            if (op === "+") {
                left += right;
            } else {
                left -= right;
            }
        }

        return left;
    }

    const result =
        expressionLevel();

    if (pos < tokens.length) {
        throw new Error(
            "Unexpected input"
        );
    }

    if (!Number.isFinite(result)) {
        throw new Error(
            "Invalid result"
        );
    }

    return result;
}

// ============================================================
// EQUATIONS
// ============================================================

function solveLinear(text) {

    let s = text
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/²/g, "^2");

    if (
        !s.includes("=") ||
        !s.includes("x")
    ) {
        return null;
    }

    if (s.includes("^2")) {
        return null;
    }

    const parts = s.split("=");

    if (parts.length !== 2) {
        return null;
    }

    function sideValues(side) {

        side =
            side.replace(/-/g, "+-");

        if (side.startsWith("+")) {
            side = side.substring(1);
        }

        const terms =
            side.split("+");

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
                ) {
                    coefficient = "1";
                }

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

    const left =
        sideValues(parts[0]);

    const right =
        sideValues(parts[1]);

    const a =
        left.a - right.a;

    const b =
        right.b - left.b;

    if (
        !Number.isFinite(a) ||
        !Number.isFinite(b)
    ) {
        return null;
    }

    if (a === 0) {

        if (b === 0) {
            return "Infinite solutions";
        }

        return "No solution";
    }

    return `x = ${fmt(b / a)}`;
}

function solveQuadratic(text) {

    const s = text
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/²/g, "^2");

    if (
        !s.includes("x^2") ||
        !s.includes("=")
    ) {
        return null;
    }

    const parts = s.split("=");

    if (parts.length !== 2) {
        return null;
    }

    const expr =
        parts[0] + "-(" + parts[1] + ")";

    const aMatch =
        expr.match(
            /([+-]?\d*\.?\d*)x\^2/
        );

    const bMatch =
        expr.match(
            /([+-]?\d*\.?\d*)x(?!\^2)/
        );

    if (!aMatch) {
        return null;
    }

    let a = aMatch[1];

    if (a === "" || a === "+") a = 1;
    if (a === "-") a = -1;

    a = Number(a);

    let b =
        bMatch ? bMatch[1] : "0";

    if (b === "" || b === "+") b = 1;
    if (b === "-") b = -1;

    b = Number(b);

    let remaining =
        expr.replace(aMatch[0], "");

    if (bMatch) {
        remaining =
            remaining.replace(
                bMatch[0],
                ""
            );
    }

    remaining =
        remaining.replace(/[()]/g, "");

    const c = Number(remaining);

    if (
        !Number.isFinite(a) ||
        !Number.isFinite(b) ||
        !Number.isFinite(c)
    ) {
        return null;
    }

    const D =
        b * b - 4 * a * c;

    if (D < 0) {
        return "No real roots";
    }

    if (D === 0) {

        return `x = ${fmt(
            -b / (2 * a)
        )}`;
    }

    const x1 =
        (-b + Math.sqrt(D)) /
        (2 * a);

    const x2 =
        (-b - Math.sqrt(D)) /
        (2 * a);

    return (
        `x₁ = ${fmt(x1)}, ` +
        `x₂ = ${fmt(x2)}`
    );
}

// ============================================================
// PERCENTAGE / STATISTICS
// ============================================================

function percentage(text) {

    const m =
        text.match(
            /([\d.]+)\s*%\s*(?:of|from)\s*([\d.]+)/i
        );

    if (!m) return null;

    return (
        Number(m[1]) *
        Number(m[2]) /
        100
    );
}

function average(text) {

    const m =
        text.match(
            /(?:average|mean)\s+(?:of\s+)?(.+)/i
        );

    if (!m) return null;

    const nums =
        m[1]
            .match(/-?\d+(?:\.\d+)?/g)
            ?.map(Number);

    if (!nums?.length) {
        return null;
    }

    return (
        nums.reduce(
            (a, b) => a + b,
            0
        ) / nums.length
    );
}

function factorial(n) {

    if (
        !Number.isInteger(n) ||
        n < 0 ||
        n > 170
    ) {
        return null;
    }

    let result = 1;

    for (
        let i = 2;
        i <= n;
        i++
    ) {
        result *= i;
    }

    return result;
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

        const r =
            Number(m[1]);

        return (
            `Circle area = ${fmt(
                Math.PI * r * r
            )}`
        );
    }

    m = text.match(
        /circumference\s+(?:of\s+)?(?:a\s+)?circle\s+(?:radius\s+)?([\d.]+)/i
    );

    if (m) {

        const r =
            Number(m[1]);

        return (
            `Circle circumference = ${fmt(
                2 * Math.PI * r
            )}`
        );
    }

    m = text.match(
        /rectangle\s+area\s+([\d.]+)\s+(?:x|by)\s+([\d.]+)/i
    );

    if (m) {

        const a =
            Number(m[1]);

        const b =
            Number(m[2]);

        return (
            `Rectangle area = ${fmt(a * b)}`
        );
    }

    m = text.match(
        /rectangle\s+perimeter\s+([\d.]+)\s+(?:x|by)\s+([\d.]+)/i
    );

    if (m) {

        const a =
            Number(m[1]);

        const b =
            Number(m[2]);

        return (
            `Rectangle perimeter = ${fmt(
                2 * (a + b)
            )}`
        );
    }

    m = text.match(
        /triangle\s+area\s+([\d.]+)\s+([\d.]+)/i
    );

    if (m) {

        return (
            `Triangle area = ${fmt(
                0.5 *
                Number(m[1]) *
                Number(m[2])
            )}`
        );
    }

    m = text.match(
        /sphere\s+volume\s+(?:radius\s+)?([\d.]+)/i
    );

    if (m) {

        const r =
            Number(m[1]);

        return (
            `Sphere volume = ${fmt(
                4 / 3 *
                Math.PI *
                r ** 3
            )}`
        );
    }

    m = text.match(
        /cylinder\s+volume\s+([\d.]+)\s+([\d.]+)/i
    );

    if (m) {

        const r =
            Number(m[1]);

        const h =
            Number(m[2]);

        return (
            `Cylinder volume = ${fmt(
                Math.PI *
                r *
                r *
                h
            )}`
        );
    }

    return null;
}

// ============================================================
// ELECTRICAL
// ============================================================

function electrical(text) {

    let m;

    // V = IR
    m = text.match(
        /voltage\s+([\d.]+)\s*(?:amp|amps|a)\s*(?:x|\*|times)\s*([\d.]+)\s*(?:ohm|ohms|r)/i
    );

    if (m) {

        return (
            `Voltage V = ${fmt(
                Number(m[1]) *
                Number(m[2])
            )} V`
        );
    }

    // P = VI
m = text.match(
    /(?:power\s+)?([\d.]+)\s*(?:volt|volts|v)\s*(?:x|\*|×|times)\s*([\d.]+)\s*(?:amp|amps|a)/i
);

if (m) {

    const V = Number(m[1]);
    const I = Number(m[2]);

    return (
        `Power P = ${fmt(V * I)} W`
    );
}

    // V / R = I
    m = text.match(
        /current\s+([\d.]+)\s*(?:volt|volts|v)\s*(?:\/|per)\s*([\d.]+)\s*(?:ohm|ohms|r)/i
    );

    if (m) {

        return (
            `Current I = ${fmt(
                Number(m[1]) /
                Number(m[2])
            )} A`
        );
    }

    // V / I = R
    m = text.match(
        /resistance\s+([\d.]+)\s*(?:volt|volts|v)\s*(?:\/|per)\s*([\d.]+)\s*(?:amp|amps|a)/i
    );

    if (m) {

        return (
            `Resistance R = ${fmt(
                Number(m[1]) /
                Number(m[2])
            )} Ω`
        );
    }

    // Series
    m = text.match(
        /series\s+resistance\s+(.+)/i
    );

    if (m) {

        const nums =
            m[1]
                .match(/[\d.]+/g)
                ?.map(Number);

        if (nums?.length) {

            return (
                `Series resistance = ${fmt(
                    nums.reduce(
                        (a, b) => a + b,
                        0
                    )
                )} Ω`
            );
        }
    }

    // Parallel
    m = text.match(
        /parallel\s+resistance\s+(.+)/i
    );

    if (m) {

        const nums =
            m[1]
                .match(/[\d.]+/g)
                ?.map(Number);

        if (nums?.length) {

            const inverse =
                nums.reduce(
                    (sum, r) =>
                        sum + 1 / r,
                    0
                );

            return (
                `Parallel resistance = ${fmt(
                    1 / inverse
                )} Ω`
            );
        }
    }

    // 3 phase power
    m = text.match(
        /3\s*phase\s+power\s+([\d.]+)\s*(?:v|volt|volts)\s+([\d.]+)\s*(?:a|amp|amps)\s+pf\s*([\d.]+)/i
    );

    if (m) {

        const V =
            Number(m[1]);

        const I =
            Number(m[2]);

        const PF =
            Number(m[3]);

        return (
            `3-Phase Power = ${fmt(
                Math.sqrt(3) *
                V *
                I *
                PF
            )} W`
        );
    }

    return null;
}

// ============================================================
// ELECTRONICS
// ============================================================

function electronics(text) {

    let m;

    // LED resistor
    m = text.match(
        /led\s+resistor\s+([\d.]+)\s*v\s+([\d.]+)\s*v\s+([\d.]+)\s*(?:ma|milliamp)/i
    );

    if (m) {

        const supply =
            Number(m[1]);

        const led =
            Number(m[2]);

        const current =
            Number(m[3]) / 1000;

        if (current === 0) {
            return null;
        }

        return (
            `LED resistor = ${fmt(
                (supply - led) /
                current
            )} Ω`
        );
    }

    // Capacitor energy
    m = text.match(
        /capacitor\s+energy\s+([\d.]+)\s*(?:uf|µf)\s+([\d.]+)\s*v/i
    );

    if (m) {

        const C =
            Number(m[1]) * 1e-6;

        const V =
            Number(m[2]);

        return (
            `Capacitor energy = ${fmt(
                0.5 * C * V * V
            )} J`
        );
    }

    // RC time constant
    m = text.match(
        /rc\s+time\s+constant\s+([\d.]+)\s*(?:ohm|r)\s+([\d.]+)\s*(?:uf|µf)/i
    );

    if (m) {

        const R =
            Number(m[1]);

        const C =
            Number(m[2]) * 1e-6;

        return (
            `RC time constant τ = ${fmt(
                R * C
            )} s`
        );
    }

    return null;
}

// ============================================================
// MECHANICAL / PHYSICS
// ============================================================

function physics(text) {

    let m;

    // Force
    m = text.match(
        /force\s+([\d.]+)\s*kg\s*(?:x|\*|times)\s*([\d.]+)\s*(?:m\/s2|m\/s²)/i
    );

    if (m) {

        return (
            `Force F = ${fmt(
                Number(m[1]) *
                Number(m[2])
            )} N`
        );
    }

    // Weight
    m = text.match(
        /weight\s+(?:of\s+)?([\d.]+)\s*(?:kg|kilogram)/i
    );

    if (m) {

        return (
            `Weight = ${fmt(
                Number(m[1]) *
                9.80665
            )} N`
        );
    }

    // Torque
    m = text.match(
        /torque\s+([\d.]+)\s*n\s*(?:x|\*|times)\s*([\d.]+)\s*m/i
    );

    if (m) {

        return (
            `Torque = ${fmt(
                Number(m[1]) *
                Number(m[2])
            )} N·m`
        );
    }

    // RPM -> rad/s
    m = text.match(
        /([\d.]+)\s*rpm\s*to\s*(?:rad\/s|radian)/i
    );

    if (m) {

        return (
            `${fmt(
                Number(m[1]) *
                2 *
                Math.PI /
                60
            )} rad/s`
        );
    }

    // Mechanical power
    m = text.match(
        /mechanical\s+power\s+([\d.]+)\s*n\s*m\s+([\d.]+)\s*rpm/i
    );

    if (m) {

        const torque =
            Number(m[1]);

        const rpm =
            Number(m[2]);

        return (
            `Mechanical Power = ${fmt(
                torque *
                rpm *
                2 *
                Math.PI /
                60
            )} W`
        );
    }

    // Work
    m = text.match(
        /work\s+([\d.]+)\s*n\s*(?:x|\*|times)\s*([\d.]+)\s*m/i
    );

    if (m) {

        return (
            `Work = ${fmt(
                Number(m[1]) *
                Number(m[2])
            )} J`
        );
    }

    // Kinetic energy
    m = text.match(
        /kinetic\s+energy\s+([\d.]+)\s*kg\s+([\d.]+)\s*m\/s/i
    );

    if (m) {

        const mass =
            Number(m[1]);

        const velocity =
            Number(m[2]);

        return (
            `Kinetic Energy = ${fmt(
                0.5 *
                mass *
                velocity *
                velocity
            )} J`
        );
    }

    // Pressure
    m = text.match(
        /pressure\s+([\d.]+)\s*n\s*(?:\/|per)\s*([\d.]+)\s*m2/i
    );

    if (m) {

        return (
            `Pressure = ${fmt(
                Number(m[1]) /
                Number(m[2])
            )} Pa`
        );
    }

    return null;
}

// ============================================================
// CIVIL ENGINEERING BASICS
// ============================================================

function civil(text) {

    let m;

    // Concrete volume
    m = text.match(
        /concrete\s+volume\s+([\d.]+)\s*m\s+([\d.]+)\s*m\s+([\d.]+)\s*m/i
    );

    if (m) {

        return (
            `Concrete volume = ${fmt(
                Number(m[1]) *
                Number(m[2]) *
                Number(m[3])
            )} m³`
        );
    }

    // Rectangular slab
    m = text.match(
        /slab\s+volume\s+([\d.]+)\s*m\s+([\d.]+)\s*m\s+([\d.]+)\s*m/i
    );

    if (m) {

        return (
            `Slab volume = ${fmt(
                Number(m[1]) *
                Number(m[2]) *
                Number(m[3])
            )} m³`
        );
    }

    // Steel weight
    m = text.match(
        /steel\s+weight\s+([\d.]+)\s*mm\s+([\d.]+)\s*m/i
    );

    if (m) {

        const diameter =
            Number(m[1]);

        const length =
            Number(m[2]);

        const weight =
            diameter *
            diameter *
            length /
            162;

        return (
            `Approx steel weight = ${fmt(
                weight
            )} kg`
        );
    }

    return null;
}

// ============================================================
// UNIT CONVERTER
// ============================================================

const UNITS = {

    length: {
        mm: 0.001,
        cm: 0.01,
        m: 1,
        km: 1000,
        in: 0.0254,
        inch: 0.0254,
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

    const m =
        text.match(
            /(-?\d+(?:\.\d+)?)\s*([a-zA-Z/]+)\s*(?:to|in)\s*([a-zA-Z/]+)/i
        );

    if (!m) return null;

    const value =
        Number(m[1]);

    const from =
        m[2].toLowerCase();

    const to =
        m[3].toLowerCase();

    // Celsius/Fahrenheit/Kelvin

    if (
        ["c", "celsius"].includes(from) &&
        ["f", "fahrenheit"].includes(to)
    ) {
        return (
            `${fmt(value * 9 / 5 + 32)} °F`
        );
    }

    if (
        ["f", "fahrenheit"].includes(from) &&
        ["c", "celsius"].includes(to)
    ) {
        return (
            `${fmt((value - 32) * 5 / 9)} °C`
        );
    }

    if (
        ["c", "celsius"].includes(from) &&
        ["k", "kelvin"].includes(to)
    ) {
        return (
            `${fmt(value + 273.15)} K`
        );
    }

    if (
        ["k", "kelvin"].includes(from) &&
        ["c", "celsius"].includes(to)
    ) {
        return (
            `${fmt(value - 273.15)} °C`
        );
    }

    for (const category of Object.keys(UNITS)) {

        const table =
            UNITS[category];

        if (
            Object.hasOwn(table, from) &&
            Object.hasOwn(table, to)
        ) {

            const base =
                value * table[from];

            const result =
                base / table[to];

            return (
                `${fmt(result)} ${to}`
            );
        }
    }

    return null;
}

// ============================================================
// COMMAND ROUTER
// ============================================================

function processCommand(rawCommand) {

    const command =
        rawCommand.trim();

    const c =
        command.toLowerCase();

    // GREETING

    if (
        /^(hello|hi|hey|vanakkam|வணக்கம்)(\s+rolex)?$/i
            .test(command)
    ) {
        return (
            "Vanakkam Boss. " +
            "Rolex AI is online."
        );
    }

    // STATUS

    if (
        c === "status" ||
        c === "system" ||
        c.includes("system status")
    ) {

        return (
            "ROLEX CORE: ONLINE\n" +
            "LOCAL BRAIN: READY\n" +
            "MATH ENGINE: READY\n" +
            "ENGINEERING: READY\n" +
            "MEMORY: READY\n" +
            "VOICE: STANDBY\n" +
            "EXTERNAL AI: OFF"
        );
    }

    // IDENTITY

    if (
        c.includes("who are you") ||
        c.includes("what are you") ||
        c.includes("nee yaar")
    ) {
        return (
            "I am Rolex AI, " +
            "your personal local intelligence system."
        );
    }

    // HELP

    if (
        c === "help" ||
        c === "/help"
    ) {

        return (
`ROLEX LOCAL BRAIN v3

MATH
25*4
sqrt(144)
2^10
sin(30)
average 10 20 30
25% of 800
5 factorial

EQUATIONS
2x+5=15
x^2+5x+6=0

GEOMETRY
area of circle radius 5
rectangle area 10 x 20
sphere volume 5

ELECTRICAL
voltage 2 amp x 10 ohm
power 230 volt x 5 amp
series resistance 10 20 30
parallel resistance 10 20

ELECTRONICS
led resistor 12v 2v 20ma
capacitor energy 100uf 12v
rc time constant 1000 ohm 100uf

MECHANICAL / PHYSICS
force 10kg x 5m/s2
weight 50kg
torque 20N x 3m
1000rpm to rad/s

CIVIL
concrete volume 5m 4m 0.15m
steel weight 12mm 10m

CONVERSION
10 km to m
100 c to f
1 kwh to j

MEMORY
remember my name is Boss
what is my name
memory
clear memory`
        );
    }

    // TIME

    if (
        c === "time" ||
        c.includes("what time") ||
        c.includes("current time")
    ) {

        return (
            "Local time: " +
            new Date().toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            )
        );
    }

    // DATE

    if (
        c === "date" ||
        c.includes("what date") ||
        c.includes("today")
    ) {

        return (
            "Today is " +
            new Date().toLocaleDateString(
                [],
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            )
        );
    }

    // MEMORY SAVE

    if (
        c.startsWith("remember ") ||
        c.startsWith("remember that ")
    ) {

        const text =
            command
                .replace(
                    /^remember that /i,
                    ""
                )
                .replace(
                    /^remember /i,
                    ""
                )
                .trim();

        const match =
            text.match(
                /^my (.+?) is (.+)$/i
            );

        if (match) {

            const key =
                match[1].trim();

            const value =
                match[2].trim();

            saveMemory(
                key,
                value
            );

            return (
                `Okay Boss. I will remember ` +
                `that your ${key} is ${value}.`
            );
        }

        saveMemory(
            "note",
            text
        );

        return (
            "Memory saved locally."
        );
    }

    // MEMORY RECALL

    if (
        c.includes("what is my") ||
        c.includes("do you remember") ||
        c === "memory" ||
        c === "memories"
    ) {

        const match =
            command.match(
                /what is my (.+?)[?]*$/i
            );

        if (match) {

            const key =
                match[1]
                    .trim()
                    .toLowerCase();

            if (
                Object.hasOwn(
                    memory,
                    key
                )
            ) {

                return (
                    `Your ${key} is ` +
                    `${memory[key]}.`
                );
            }

            return (
                `I don't have a saved ` +
                `memory for your ${key}.`
            );
        }

        const keys =
            Object.keys(memory);

        if (!keys.length) {
            return (
                "Local memory is empty."
            );
        }

        return (
            "Local memories:\n" +
            keys
                .map(
                    k =>
                        `${k} = ${memory[k]}`
                )
                .join("\n")
        );
    }

    // CLEAR MEMORY
    if (
        c === "clear memory" ||
        c === "forget everything" ||
        c === "delete memory"
    ) {

        clearMemory();

        return (
            "Local Rolex memory has been cleared."
        );
    }

    // FACTORIAL

    let factorialMatch =
        command.match(
            /(?:factorial|fact)\s+(\d+)/i
        );

    if (factorialMatch) {

        const n =
            Number(factorialMatch[1]);

        const result =
            factorial(n);

        if (result !== null) {

            return (
                `${n}! = ${result}`
            );
        }
    }

    // EQUATIONS

    const quadratic =
        solveQuadratic(command);

    if (quadratic) {
        return (
            `Quadratic solution: ${quadratic}`
        );
    }

    const linear =
        solveLinear(command);

    if (linear) {
        return (
            `Equation solution: ${linear}`
        );
    }

    // PERCENTAGE

    const percent =
        percentage(command);

    if (percent !== null) {

        return (
            `Percentage result: ${fmt(percent)}`
        );
    }

    // AVERAGE

    const avg =
        average(command);

    if (avg !== null) {

        return (
            `Average = ${fmt(avg)}`
        );
    }

    // GEOMETRY

    const geo =
        geometry(command);

    if (geo) return geo;

    // ELECTRICAL

    const elec =
        electrical(command);

    if (elec) return elec;

    // ELECTRONICS

    const electronic =
        electronics(command);

    if (electronic) {
        return electronic;
    }

    // PHYSICS

    const phys =
        physics(command);

    if (phys) return phys;

    // CIVIL

    const civilResult =
        civil(command);

    if (civilResult) {
        return civilResult;
    }

    // CONVERSION

    const converted =
        conversion(command);

    if (converted) {

        return (
            `Conversion result: ${converted}`
        );
    }

    // SQRT NATURAL

    const sqrtMatch =
        command.match(
            /(?:square root|sqrt)\s+(?:of\s+)?([\d.]+)/i
        );

    if (sqrtMatch) {

        return (
            `√${sqrtMatch[1]} = ${fmt(
                Math.sqrt(
                    Number(sqrtMatch[1])
                )
            )}`
        );
    }

    // NORMAL MATH

    let expression =
        command
            .replace(
                /^what is\s+/i,
                ""
            )
            .replace(
                /^calculate\s+/i,
                ""
            )
            .replace(
                /^calc\s+/i,
                ""
            )
            .replace(
                /^answer\s+/i,
                ""
            )
            .replace(
                /^solve\s+/i,
                ""
            )
            .replace(
                /\?/g,
                ""
            )
            .trim();

    const degrees =
        /\bdegrees?\b|\bdeg\b/i
            .test(expression);

    expression =
        expression
            .replace(
                /\bdegrees?\b/gi,
                ""
            )
            .replace(
                /\bdeg\b/gi,
                ""
            )
            .trim();

    try {

        if (
            /^[0-9a-zA-Zπ+\-*/%^().,\s×÷−]+$/i
                .test(expression)
        ) {

            const result =
                evaluateExpression(
                    expression,
                    degrees
                );

            return (
                `Calculation result: ${fmt(result)}`
            );
        }

    } catch (_) {}

    // DEFAULT

    return (
        "I understood the command locally, Boss. " +
        "That formula is not yet in my library. " +
        "No external AI is connected."
    );
}

// ============================================================
// SEND
// ============================================================

function sendCommand() {

    if (!input) return;

    const raw =
        input.value.trim();

    if (!raw) return;

    // Support multiple commands
    // separated by newline or ;
    const commands =
        raw
            .split(/\n|;/)
            .map(x => x.trim())
            .filter(Boolean);

    input.value = "";

    commands.forEach((command, index) => {

        addMessage(
            "YOU",
            command
        );

        const reply =
            processCommand(command);

        setTimeout(() => {

            addMessage(
                "ROLEX",
                reply
            );

        }, 250 * index);
    });
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
        event => {

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

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.onstart =
        function () {

            if (voiceButton) {

                voiceButton.innerHTML =
                    "<span>●</span> LISTENING";

                voiceButton.classList.add(
                    "listening"
                );
            }
        };

    recognition.onresult =
        function (event) {

            const spokenText =
                event.results[0][0]
                    .transcript;

            if (input) {
                input.value =
                    spokenText;
            }

            sendCommand();
        };

    recognition.onerror =
        function () {

            if (voiceButton) {

                voiceButton.innerHTML =
                    "<span>●</span> VOICE";

                voiceButton.classList.remove(
                    "listening"
                );
            }
        };

    recognition.onend =
        function () {

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
            function () {

                try {
                    recognition.start();
                } catch (_) {}
            }
        );
    }

} else {

    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            function () {

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
            "Local Brain v3 online. No external AI connected."
        );

    }, 400);
}

startup();
