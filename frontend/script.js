// ==========================================
// ROLEX AI — LOCAL BRAIN v1
// No API • No Gemini • No OpenAI
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendButton = document.getElementById("send");
const voiceButton = document.getElementById("voiceButton");

let memory = JSON.parse(localStorage.getItem("rolex_memory") || "{}");

// ------------------------------------------
// CHAT
// ------------------------------------------

function addMessage(sender, text) {
    const row = document.createElement("div");

    row.className = sender === "YOU"
        ? "message user-message"
        : "message rolex-message";

    row.innerHTML = `
        <strong>${sender}</strong>
        <span>${escapeHTML(text)}</span>
    `;

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

function escapeHTML(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ------------------------------------------
// LOCAL MEMORY
// ------------------------------------------

function saveMemory(key, value) {
    memory[key] = value;
    localStorage.setItem("rolex_memory", JSON.stringify(memory));
}

function clearMemory() {
    memory = {};
    localStorage.removeItem("rolex_memory");
}


// ------------------------------------------
// CALCULATOR
// ------------------------------------------

function calculate(expression) {

    let exp = expression.toLowerCase().trim();

    // Remove common calculation phrases
    exp = exp
        .replace(/^what is\s+/i, "")
        .replace(/^calculate\s+/i, "")
        .replace(/^calc\s+/i, "")
        .replace(/^answer\s+/i, "")
        .replace(/^solve\s+/i, "");

    // Natural language operators
    exp = exp
        .replace(/multiplied by/g, "*")
        .replace(/multiply by/g, "*")
        .replace(/divided by/g, "/")
        .replace(/divide by/g, "/")
        .replace(/plus/g, "+")
        .replace(/minus/g, "-")
        .replace(/times/g, "*")
        .replace(/\binto\b/g, "*")
        .replace(/\bx\b/g, "*");

    // Tamil/Tanglish operators
    exp = exp
        .replace(/கூட்டல்/g, "+")
        .replace(/கழித்தல்/g, "-")
        .replace(/பெருக்கல்/g, "*")
        .replace(/வகுத்தல்/g, "/")
        .replace(/கூட்டு/g, "+")
        .replace(/கழி/g, "-")
        .replace(/பெருக்கு/g, "*")
        .replace(/வகுக்கு/g, "/");

    // Remove question marks and unnecessary spaces
    exp = exp
        .replace(/\?/g, "")
        .trim();

    // Only allow mathematical characters
    if (!/^[0-9+\-*/%.()\s]+$/.test(exp)) {
        return null;
    }

    try {

        const result = Function(
            `"use strict"; return (${exp})`
        )();

        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            return null;
        }

        return result;

    } catch {

        return null;
    }
}

    try {
        const result = Function(`"use strict"; return (${exp})`)();

        if (typeof result !== "number" || !Number.isFinite(result)) {
            return null;
        }

        return result;
    } catch {
        return null;
    }
}


// ------------------------------------------
// COMMAND PROCESSOR
// ------------------------------------------

function processCommand(rawCommand) {

    const command = rawCommand.trim();
    const c = command.toLowerCase();

    // ---------------- HELLO ----------------

    if (
        c === "hello" ||
        c === "hi" ||
        c === "hey" ||
        c === "hey rolex" ||
        c === "hello rolex"
    ) {
        return "Hello Boss. Rolex AI is online.";
    }


    // ---------------- STATUS ----------------

    if (
        c.includes("system status") ||
        c === "status" ||
        c === "system"
    ) {
        return "All local systems are operational. Core online. Memory ready. Voice standby.";
    }


    // ---------------- WHO ARE YOU ----------------

    if (
        c.includes("who are you") ||
        c.includes("what are you")
    ) {
        return "I am Rolex AI, your personal intelligence system.";
    }


    // ---------------- ONLINE ----------------

    if (
        c === "online" ||
        c.includes("are you online")
    ) {
        return "Yes Boss. Rolex AI is online and running in local mode.";
    }


    // ---------------- HELP ----------------

    if (c === "help" || c === "/help") {
        return "Try: hello, status, time, date, calculate 25*4, remember my name is Boss, what is my name, memory, or clear memory.";
    }


    // ---------------- TIME ----------------

    if (
        c === "time" ||
        c.includes("what time") ||
        c.includes("current time")
    ) {
        return "Local time: " +
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
    }


    // ---------------- DATE ----------------

    if (
        c === "date" ||
        c.includes("today") ||
        c.includes("what date")
    ) {
        return "Today is " +
            new Date().toLocaleDateString([], {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
    }


    // ---------------- REMEMBER ----------------

    if (
        c.startsWith("remember ") ||
        c.startsWith("remember that ")
    ) {

        let text = command
            .replace(/^remember that /i, "")
            .replace(/^remember /i, "")
            .trim();

        const match = text.match(/^my (.+?) is (.+)$/i);

        if (match) {

            const key = match[1].trim();
            const value = match[2].trim();

            saveMemory(key, value);

            return `Okay Boss. I will remember that your ${key} is ${value}.`;
        }

        saveMemory("note", text);

        return "Memory saved locally.";
    }


    // ---------------- RECALL ----------------

    if (
        c.includes("what is my") ||
        c.includes("do you remember") ||
        c === "memory" ||
        c === "memories"
    ) {

        const match = command.match(/what is my (.+?)[?]*$/i);

        if (match) {

            const key = match[1].trim();

            if (memory[key]) {
                return `Your ${key} is ${memory[key]}.`;
            }

            return `I don't have a saved memory for your ${key}.`;
        }

        const keys = Object.keys(memory);

        if (keys.length === 0) {
            return "Local memory is currently empty.";
        }

        return "Local memories: " +
            keys.map(key => `${key} = ${memory[key]}`).join(", ");
    }


    // ---------------- CLEAR MEMORY ----------------

    if (
        c === "clear memory" ||
        c === "forget everything" ||
        c === "delete memory"
    ) {
        clearMemory();
        return "Local Rolex memory has been cleared.";
    }


    // ---------------- CALCULATOR ----------------

    const result = calculate(command);

    if (result !== null) {
        return `Calculation result: ${result}`;
    }


    // ---------------- DEFAULT ----------------

    return "I understood the command locally, Boss. This Brain is currently running without an external AI.";
}


// ------------------------------------------
// SEND COMMAND
// ------------------------------------------

function sendCommand() {

    const command = input.value.trim();

    if (!command) return;

    addMessage("YOU", command);

    input.value = "";

    const reply = processCommand(command);

    setTimeout(() => {
        addMessage("ROLEX", reply);
    }, 250);
}


// ------------------------------------------
// BUTTON
// ------------------------------------------

if (sendButton) {
    sendButton.addEventListener("click", sendCommand);
}


// ------------------------------------------
// ENTER KEY
// ------------------------------------------

if (input) {
    input.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            event.preventDefault();
            sendCommand();
        }

    });
}


// ==========================================
// VOICE
// ==========================================

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
            voiceButton.innerHTML = "<span>●</span> LISTENING";
            voiceButton.classList.add("listening");
        }
    };


    recognition.onresult = function(event) {

        const spokenText =
            event.results[0][0].transcript;

        input.value = spokenText;

        sendCommand();
    };


    recognition.onerror = function() {

        if (voiceButton) {
            voiceButton.innerHTML = "<span>●</span> VOICE";
            voiceButton.classList.remove("listening");
        }
    };


    recognition.onend = function() {

        if (voiceButton) {
            voiceButton.innerHTML = "<span>●</span> VOICE";
            voiceButton.classList.remove("listening");
        }
    };


    if (voiceButton) {

        voiceButton.addEventListener("click", function() {

            try {
                recognition.start();
            } catch {
                // Prevent duplicate start error
            }

        });

    }

} else {

    if (voiceButton) {

        voiceButton.addEventListener("click", function() {

            addMessage(
                "ROLEX",
                "Voice recognition is not supported by this browser."
            );

        });

    }
}


// ------------------------------------------
// STARTUP
// ------------------------------------------

function startup() {

    addMessage(
        "ROLEX",
        "Systems initialized, Boss."
    );

    setTimeout(() => {

        addMessage(
            "ROLEX",
            "Local Brain online. No external AI connected."
        );

    }, 500);
}

startup();
