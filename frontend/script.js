# Rolex AI script.js generator
# This Python file creates the complete script.js locally.
# Run: python generate_rolex_script.py

SCRIPT = r"""/* =========================================================
   ROLEX AI — LOCAL ENGINE v3
   A-Z ENGINEERING + MATH + MEMORY + VOICE
   100% LOCAL / NO EXTERNAL AI
   ========================================================= */

"use strict";

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const voiceButton = document.getElementById("voiceButton");

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function addMessage(sender, text) {
    if (!chat) return;
    const row = document.createElement("div");
    row.className = sender === "YOU" ? "message user" : "message rolex";
    row.innerHTML = `<strong>${escapeHTML(sender)}</strong><br>${escapeHTML(text)}`;
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

function fmt(value) {
    if (!Number.isFinite(value)) return "undefined";
    if (Math.abs(value) < 1e-12) return "0";
    return Number(value.toFixed(12)).toString();
}

let memory = {};
try {
    memory = JSON.parse(localStorage.getItem("rolex_memory") || "{}");
} catch {
    memory = {};
}

function saveMemory(key, value) {
    key = key.trim().toLowerCase();
    memory[key] = value;
    localStorage.setItem("rolex_memory", JSON.stringify(memory));
}

function clearMemory() {
    memory = {};
    localStorage.removeItem("rolex_memory");
}

function recallMemory(key) {
    key = key.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(memory, key)) {
        return memory[key];
    }
    return null;
}

const mathFunctions = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    ln: Math.log, log: Math.log10, exp: Math.exp
};

const mathConstants = { pi: Math.PI, e: Math.E };

function tokenizeMath(expression) {
    const tokens = [];
    const regex = /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|([A-Za-z_]\w*)|(.))/gi;
    let match;
    while ((match = regex.exec(expression)) !== null) {
        if (match[1]) tokens.push({type:"number", value:Number(match[1])});
        else if (match[2]) tokens.push({type:"name", value:match[2].toLowerCase()});
        else tokens.push({type:"symbol", value:match[3]});
    }
    return tokens;
}

function evaluateMath(expression) {
    const tokens = tokenizeMath(expression);
    let position = 0;

    function peek() { return tokens[position]; }

    function consume(value) {
        const token = peek();
        if (token && token.value === value) {
            position++;
            return true;
        }
        return false;
    }

    function parsePrimary() {
        const token = peek();
        if (!token) throw new Error("Unexpected end");

        if (token.type === "number") {
            position++;
            return token.value;
        }

        if (token.type === "name") {
            position++;
            const name = token.value;

            if (Object.prototype.hasOwnProperty.call(mathConstants, name)) {
                return mathConstants[name];
            }

            if (Object.prototype.hasOwnProperty.call(mathFunctions, name)) {
                if (!consume("(")) throw new Error("Function needs ()");
                const value = parseExpression();
                if (!consume(")")) throw new Error("Missing )");
                return mathFunctions[name](value);
            }

            throw new Error("Unknown name: " + name);
        }

        if (consume("(")) {
            const value = parseExpression();
            if (!consume(")")) throw new Error("Missing )");
            return value;
        }

        throw new Error("Invalid expression");
    }

    function parseUnary() {
        if (consume("+")) return parseUnary();
        if (consume("-")) return -parseUnary();
        return parsePrimary();
    }

    function parsePower() {
        let left = parseUnary();
        if (consume("^")) {
            const right = parsePower();
            left = Math.pow(left, right);
        }
        return left;
    }

    function parseTerm() {
        let value = parsePower();
        while (true) {
            if (consume("*")) value *= parsePower();
            else if (consume("/")) {
                const divisor = parsePower();
                if (divisor === 0) throw new Error("Division by zero");
                value /= divisor;
            } else if (consume("%")) value %= parsePower();
            else break;
        }
        return value;
    }

    function parseExpression() {
        let value = parseTerm();
        while (true) {
            if (consume("+")) value += parseTerm();
            else if (consume("-")) value -= parseTerm();
            else break;
        }
        return value;
    }

    const result = parseExpression();
    if (position !== tokens.length) throw new Error("Invalid expression");
    return result;
}

function basicMath(text) {
    const t = text.toLowerCase().trim();
    let m = t.match(/^sqrt\s+([\d.]+)$/);
    if (m) return `√${m[1]} = ${fmt(Math.sqrt(Number(m[1])))}`;

    m = t.match(/^(?:factorial|fact)\s+(\d+)$/);
    if (m) {
        const n = Number(m[1]);
        if (n > 170) return "Factorial too large.";
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return `${n}! = ${fmt(result)}`;
    }

    m = t.match(/([\d.]+)\s*%\s*(?:of)\s*([\d.]+)/);
    if (m) return `${m[1]}% of ${m[2]} = ${fmt(Number(m[1]) * Number(m[2]) / 100)}`;

    m = t.match(/^average\s+(.+)$/);
    if (m) {
        const values = m[1].split(/[,\s]+/).filter(Boolean).map(Number);
        if (values.length && values.every(Number.isFinite)) {
            return `Average = ${fmt(values.reduce((a,b)=>a+b,0) / values.length)}`;
        }
    }

    if (/^[\d\s+\-*/%^().a-z]+$/i.test(t) && /[\d)]/.test(t)) {
        try { return `Answer = ${fmt(evaluateMath(t))}`; }
        catch {}
    }
    return null;
}

function geometry(text) {
    const t = text.toLowerCase();
    let m = t.match(/circle\s+area\s+(?:radius\s+)?([\d.]+)/);
    if (m) {
        const r = Number(m[1]);
        return `Circle area = ${fmt(Math.PI*r*r)}`;
    }

    m = t.match(/circle\s+(?:circumference|perimeter)\s+(?:radius\s+)?([\d.]+)/);
    if (m) {
        const r = Number(m[1]);
        return `Circle circumference = ${fmt(2*Math.PI*r)}`;
    }

    m = t.match(/rectangle\s+area\s+([\d.]+)\s+([\d.]+)/);
    if (m) return `Rectangle area = ${fmt(Number(m[1])*Number(m[2]))}`;

    m = t.match(/triangle\s+area\s+([\d.]+)\s+([\d.]+)/);
    if (m) return `Triangle area = ${fmt(0.5*Number(m[1])*Number(m[2]))}`;

    m = t.match(/sphere\s+volume\s+(?:radius\s+)?([\d.]+)/);
    if (m) {
        const r = Number(m[1]);
        return `Sphere volume = ${fmt(4/3*Math.PI*r**3)}`;
    }

    m = t.match(/cylinder\s+volume\s+(?:radius\s+)?([\d.]+)\s+(?:height\s+)?([\d.]+)/);
    if (m) {
        const r=Number(m[1]), h=Number(m[2]);
        return `Cylinder volume = ${fmt(Math.PI*r*r*h)}`;
    }
    return null;
}

function electrical(text) {
    const t = text.toLowerCase();
    let m;

    m=t.match(/([\d.]+)\s*(?:volt|volts|v)\s*(?:\/|divided by)\s*([\d.]+)\s*(?:amp|amps|a)/);
    if(m) {
        const V=Number(m[1]), I=Number(m[2]);
        if(I!==0) return `Resistance R = ${fmt(V/I)} Ω`;
    }

    m=t.match(/(?:power\s+)?([\d.]+)\s*(?:volt|volts|v)\s*(?:x|\*|×|times)\s*([\d.]+)\s*(?:amp|amps|a)/);
    if(m) return `Power P = ${fmt(Number(m[1])*Number(m[2]))} W`;

    m=t.match(/(?:power\s+)?([\d.]+)\s*(?:amp|amps|a)\s*(?:\^2|squared)\s*(?:x|\*|×|times)\s*([\d.]+)\s*(?:ohm|Ω)/);
    if(m) {
        const I=Number(m[1]), R=Number(m[2]);
        return `Power P = ${fmt(I*I*R)} W`;
    }

    m=t.match(/(?:power\s+)?([\d.]+)\s*(?:volt|volts|v)\s*(?:\^2|squared)\s*(?:\/|divided by)\s*([\d.]+)\s*(?:ohm|Ω)/);
    if(m) {
        const V=Number(m[1]), R=Number(m[2]);
        if(R!==0) return `Power P = ${fmt(V*V/R)} W`;
    }

    m=t.match(/(?:current\s+)?([\d.]+)\s*(?:w|watt|watts)\s*(?:\/|divided by)\s*([\d.]+)\s*(?:v|volt|volts)/);
    if(m) return `Current I = ${fmt(Number(m[1])/Number(m[2]))} A`;

    m=t.match(/series\s+(?:resistance\s+)?([\d.\s,+]+)/);
    if(m) {
        const values=m[1].split(/[,\s+]+/).filter(Boolean).map(Number);
        if(values.length>=2 && values.every(Number.isFinite))
            return `Series resistance = ${fmt(values.reduce((a,b)=>a+b,0))} Ω`;
    }

    m=t.match(/parallel\s+(?:resistance\s+)?([\d.]+)\s*(?:ohm|Ω)\s*(?:and|,|\+)\s*([\d.]+)\s*(?:ohm|Ω)/);
    if(m) {
        const R1=Number(m[1]), R2=Number(m[2]);
        return `Parallel resistance = ${fmt(R1*R2/(R1+R2))} Ω`;
    }

    m=t.match(/3[\s-]?phase.*?([\d.]+)\s*(?:v|volt|volts).*?([\d.]+)\s*(?:a|amp|amps).*?pf\s*=?\s*([\d.]+)/);
    if(m) {
        return `3-phase power = ${fmt(Math.sqrt(3)*Number(m[1])*Number(m[2])*Number(m[3]))} W`;
    }

    m=t.match(/led\s+resistor\s+([\d.]+)\s*v\s+([\d.]+)\s*v\s+([\d.]+)\s*ma/);
    if(m) {
        const supply=Number(m[1]), led=Number(m[2]), current=Number(m[3])/1000;
        if(current!==0) return `LED resistor = ${fmt((supply-led)/current)} Ω`;
    }

    m=t.match(/capacitor\s+energy\s+([\d.]+)\s*(?:uf|µf)\s*([\d.]+)\s*v/);
    if(m) {
        const C=Number(m[1])*1e-6, V=Number(m[2]);
        return `Capacitor energy = ${fmt(0.5*C*V*V)} J`;
    }

    m=t.match(/capacitor\s+charge\s+([\d.]+)\s*(uf|µf|nf|pf)\s*([\d.]+)\s*v/);
    if(m) {
        let C=Number(m[1]), unit=m[2].toLowerCase();
        if(unit==="nf") C*=1e-9; else if(unit==="pf") C*=1e-12; else C*=1e-6;
        return `Capacitor charge Q = ${fmt(C*Number(m[3]))} C`;
    }

    m=t.match(/rc\s+time\s+constant\s+([\d.]+)\s*(?:ohm|r|Ω)\s+([\d.]+)\s*(?:uf|µf)/);
    if(m) return `RC time constant τ = ${fmt(Number(m[1])*Number(m[2])*1e-6)} s`;

    m=t.match(/rc\s+cutoff\s+frequency\s+([\d.]+)\s*(?:ohm|Ω)\s+([\d.]+)\s*(?:uf|µf)/);
    if(m) return `RC cutoff frequency fc = ${fmt(1/(2*Math.PI*Number(m[1])*Number(m[2])*1e-6))} Hz`;

    m=t.match(/inductor\s+energy\s+([\d.]+)\s*mh\s+([\d.]+)\s*a/);
    if(m) return `Inductor energy = ${fmt(0.5*Number(m[1])*1e-3*Number(m[2])**2)} J`;

    m=t.match(/inductor\s+reactance\s+([\d.]+)\s*hz\s+([\d.]+)\s*mh/);
    if(m) return `Inductive reactance XL = ${fmt(2*Math.PI*Number(m[1])*Number(m[2])*1e-3)} Ω`;

    m=t.match(/capacitive\s+reactance\s+([\d.]+)\s*hz\s+([\d.]+)\s*(?:uf|µf)/);
    if(m) return `Capacitive reactance XC = ${fmt(1/(2*Math.PI*Number(m[1])*Number(m[2])*1e-6))} Ω`;

    m=t.match(/resonant\s+frequency\s+([\d.]+)\s*mh\s+([\d.]+)\s*(?:uf|µf)/);
    if(m) return `Resonant frequency f₀ = ${fmt(1/(2*Math.PI*Math.sqrt(Number(m[1])*1e-3*Number(m[2])*1e-6)))} Hz`;

    return null;
}

function physics(text) {
    const t=text.toLowerCase();
    let m;

    m=t.match(/force\s+([\d.]+)\s*kg\s+([\d.]+)\s*(?:m\/s2|m\/s²|m\/s\^2)/);
    if(m) return `Force F = ${fmt(Number(m[1])*Number(m[2]))} N`;

    m=t.match(/weight\s+([\d.]+)\s*kg/);
    if(m) return `Weight = ${fmt(Number(m[1])*9.80665)} N`;

    m=t.match(/torque\s+([\d.]+)\s*n\s*(?:x|\*|×|times)\s*([\d.]+)\s*m/);
    if(m) return `Torque = ${fmt(Number(m[1])*Number(m[2]))} N·m`;

    m=t.match(/([\d.]+)\s*rpm\s*(?:to|in|=)\s*rad\/s/);
    if(m) return `${fmt(Number(m[1])*2*Math.PI/60)} rad/s`;

    m=t.match(/mechanical\s+power\s+([\d.]+)\s*n.?m\s*(?:x|\*|×|times)\s*([\d.]+)\s*rad\/s/);
    if(m) return `Mechanical power = ${fmt(Number(m[1])*Number(m[2]))} W`;

    m=t.match(/work\s+([\d.]+)\s*n\s*(?:x|\*|×|times)\s*([\d.]+)\s*m/);
    if(m) return `Work = ${fmt(Number(m[1])*Number(m[2]))} J`;

    m=t.match(/kinetic\s+energy\s+([\d.]+)\s*kg\s+([\d.]+)\s*m\/s/);
    if(m) return `Kinetic energy = ${fmt(0.5*Number(m[1])*Number(m[2])**2)} J`;

    m=t.match(/momentum\s+([\d.]+)\s*kg\s+([\d.]+)\s*m\/s/);
    if(m) return `Momentum = ${fmt(Number(m[1])*Number(m[2]))} kg·m/s`;

    m=t.match(/pressure\s+([\d.]+)\s*n\s*(?:\/|divided by)\s*([\d.]+)\s*m2/);
    if(m) return `Pressure = ${fmt(Number(m[1])/Number(m[2]))} Pa`;

    m=t.match(/density\s+([\d.]+)\s*kg\s*(?:\/|divided by)\s*([\d.]+)\s*m3/);
    if(m) return `Density = ${fmt(Number(m[1])/Number(m[2]))} kg/m³`;

    return null;
}

function civil(text) {
    const t=text.toLowerCase();
    let m=t.match(/concrete\s+volume\s+([\d.]+)\s*m\s+([\d.]+)\s*m\s+([\d.]+)\s*m/);
    if(m) return `Concrete volume = ${fmt(Number(m[1])*Number(m[2])*Number(m[3]))} m³`;

    m=t.match(/slab\s+volume\s+([\d.]+)\s*m\s+([\d.]+)\s*m\s+([\d.]+)\s*(mm|m)/);
    if(m) {
        let thickness=Number(m[3]);
        if(m[4].toLowerCase()==="mm") thickness/=1000;
        return `Slab volume = ${fmt(Number(m[1])*Number(m[2])*thickness)} m³`;
    }

    m=t.match(/steel\s+weight\s+([\d.]+)\s*mm\s+([\d.]+)\s*m/);
    if(m) return `Approx steel weight = ${fmt(Number(m[1])**2*Number(m[2])/162)} kg`;

    m=t.match(/steel\s+(?:bar\s+)?area\s+([\d.]+)\s*mm/);
    if(m) return `Steel bar area = ${fmt(Math.PI*Number(m[1])**2/4)} mm²`;

    return null;
}

function conversion(text) {
    const t=text.toLowerCase();
    let m=t.match(/([\d.-]+)\s*(?:c|°c|celsius)\s*(?:to|in|=)\s*(?:f|°f|fahrenheit)/);
    if(m) return `${fmt(Number(m[1])*9/5+32)} °F`;

    m=t.match(/([\d.-]+)\s*(?:f|°f|fahrenheit)\s*(?:to|in|=)\s*(?:c|°c|celsius)/);
    if(m) return `${fmt((Number(m[1])-32)*5/9)} °C`;

    m=t.match(/([\d.]+)\s*km\/h\s*(?:to|in|=)\s*m\/s/);
    if(m) return `${fmt(Number(m[1])/3.6)} m/s`;

    m=t.match(/([\d.]+)\s*m\/s\s*(?:to|in|=)\s*km\/h/);
    if(m) return `${fmt(Number(m[1])*3.6)} km/h`;

    m=t.match(/([\d.]+)\s*bar\s*(?:to|in|=)\s*pa/);
    if(m) return `${fmt(Number(m[1])*100000)} Pa`;

    m=t.match(/([\d.]+)\s*kw\s*(?:to|in|=)\s*w/);
    if(m) return `${fmt(Number(m[1])*1000)} W`;

    m=t.match(/([\d.]+)\s*(?:hp|horsepower)\s*(?:to|in|=)\s*w/);
    if(m) return `${fmt(Number(m[1])*745.699872)} W`;

    m=t.match(/([\d.]+)\s*rpm\s*(?:to|in|=)\s*rad\/s/);
    if(m) return `${fmt(Number(m[1])*2*Math.PI/60)} rad/s`;

    return null;
}

function engineeringFormula(text) {
    return electrical(text) || physics(text) || civil(text) ||
           geometry(text) || conversion(text);
}

function processCommand(command) {
    const text=command.trim();
    const lower=text.toLowerCase();

    if (/^(hi|hello|hey|hai|vanakkam)\b/i.test(text))
        return "Vanakkam! Naan Rolex AI. Sollunga.";

    if (lower==="help" || lower==="/help")
        return "ROLEX AI LOCAL ENGINE\n\nMath: 25*4, sqrt(144), 2^10\nMemory: remember my name is Boss\nRecall: what is my name\nElectrical: 230 volt x 5 amp\nElectronics: led resistor 12v 2v 20ma\nMechanical: torque 20N x 3m\nCivil: concrete volume 5m 4m 0.15m\nConversion: 100km/h to m/s";

    let m=lower.match(/^remember\s+my\s+(.+?)\s+is\s+(.+)$/i);
    if(m) {
        saveMemory(m[1].trim(),m[2].trim());
        return `Saved. Your ${m[1].trim()} is ${m[2].trim()}.`;
    }

    m=lower.match(/^what\s+is\s+my\s+(.+?)(?:\s+status)?\s*\??$/i);
    if(m) {
        const key=m[1].trim();
        const value=recallMemory(key);
        if(value!==null) return `Your ${key} is ${value}.`;
        return `I don't have a saved memory for your ${key}.`;
    }

    if(lower==="clear memory" || lower==="/forget all") {
        clearMemory();
        return "All local Rolex memory has been cleared.";
    }

    const engineeringReply=engineeringFormula(text);
    if(engineeringReply) return engineeringReply;

    const mathReply=basicMath(text);
    if(mathReply) return mathReply;

    return "Local engine: formula or command not found in the current library.";
}

function sendCommand() {
    if(!input) return;
    const raw=input.value.trim();
    if(!raw) return;

    const commands=raw.split(/\n|;/).map(x=>x.trim()).filter(Boolean);
    input.value="";

    commands.forEach((command,index)=>{
        addMessage("YOU",command);
        const reply=processCommand(command);
        setTimeout(()=>addMessage("ROLEX",reply),250*index);
    });
}

if(send) send.addEventListener("click",sendCommand);

if(input) {
    input.addEventListener("keydown",event=>{
        if(event.key==="Enter" && !event.shiftKey) {
            event.preventDefault();
            sendCommand();
        }
    });
}

let recognition=null;
const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition;

if(SpeechRecognition) {
    recognition=new SpeechRecognition();
    recognition.lang="en-IN";
    recognition.continuous=false;
    recognition.interimResults=false;

    recognition.onstart=()=>{
        if(voiceButton) voiceButton.innerText="🎙️ LISTENING...";
    };

    recognition.onresult=event=>{
        const transcript=event.results[0][0].transcript.trim();
        if(input) input.value=transcript;
        sendCommand();
    };

    recognition.onerror=event=>{
        addMessage("ROLEX","Voice error: "+event.error);
        if(voiceButton) voiceButton.innerText="🎙️ VOICE";
    };

    recognition.onend=()=>{
        if(voiceButton) voiceButton.innerText="🎙️ VOICE";
    };
}

if(voiceButton) {
    voiceButton.addEventListener("click",()=>{
        if(!recognition) {
            addMessage("ROLEX","Voice recognition is not supported in this browser.");
            return;
        }
        try { recognition.start(); } catch {}
    });
}

function startup() {
    addMessage("ROLEX","Vanakkam! Rolex AI local engine online. 100% local calculation system ready.");
}

startup();
"""

OUTPUT = "script.js"

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(SCRIPT)

print(f"Created {OUTPUT}")
print(f"Size: {len(SCRIPT):,} characters")
