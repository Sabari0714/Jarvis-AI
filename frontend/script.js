const chat = document.getElementById("chat");
const input = document.getElementById("commandInput");
const sendButton = document.getElementById("sendButton");
const voiceButton = document.getElementById("voiceButton");

function addMessage(sender, text) {
    const message = document.createElement("div");
    message.className = "message";
    message.innerHTML = `<span>${sender}:</span> ${text}`;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
}

function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getDate() {
    return new Date().toLocaleDateString();
}

function processCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (
        cmd === "hello" ||
        cmd === "hi" ||
        cmd === "hey rolex"
    ) {
        return "Hello Boss. Rolex AI is ready.";
    }

    if (
        cmd.includes("status") ||
        cmd.includes("system status")
    ) {
        return "All local systems are operational.";
    }

    if (cmd === "time") {
        return `Current time is ${getTime()}.`;
    }

    if (cmd === "date") {
        return `Today's date is ${getDate()}.`;
    }

    if (cmd === "help") {
        return "Available commands: Hello, Status, Time, Date, Help.";
    }

    return "I received your command. Local demo mode is active.";
}

function sendCommand() {
    const command = input.value.trim();

    if (!command) return;

    addMessage("YOU", command);
    input.value = "";

    setTimeout(() => {
        const reply = processCommand(command);
        addMessage("ROLEX AI", reply);
    }, 350);
}

sendButton.addEventListener("click", sendCommand);

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendCommand();
    }
});

voiceButton.addEventListener("click", () => {
    addMessage("ROLEX AI", "Voice module is ready for the next stage.");
});

function startup() {
    addMessage("ROLEX AI", "Systems initialized, Boss.");
    addMessage("ROLEX AI", `Local time: ${getTime()}`);
}

startup();
