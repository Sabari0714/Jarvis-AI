const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");

send.onclick = sendMessage;

input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function sendMessage() {
    const text = input.value.trim();

    if (!text) return;

    addMessage("YOU: " + text, "user");

    input.value = "";

    const reply = processCommand(text);

    addMessage("J.A.R.V.I.S: Processing...", "ai");

    setTimeout(() => {
        chat.lastElementChild.innerText =
            "J.A.R.V.I.S: " + reply;
    }, 400);
}

function processCommand(text) {
    const command = text.toLowerCase().trim();

    if (
        command === "hi" ||
        command === "hello" ||
        command === "hey jarvis"
    ) {
        return "Hello, Boss. Systems are ready.";
    }

    if (
        command === "status" ||
        command === "system status"
    ) {
        return "All available systems are online. Voice and Memory are currently locked.";
    }

    if (command === "help") {
        return "Available commands: HELLO, STATUS, TIME, DATE, HELP.";
    }

    if (command === "time") {
        return "Current time is " +
            new Date().toLocaleTimeString();
    }

    if (command === "date") {
        return "Today's date is " +
            new Date().toLocaleDateString();
    }

    return "Command received. I am currently operating in offline demo mode.";
}

function addMessage(text, type) {
    const message = document.createElement("div");

    message.className = "msg " + type;
    message.innerText = text;

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
}

function startup() {
    const now = new Date();

    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    addMessage(
        "J.A.R.V.I.S: Systems initialized, Boss.",
        "ai"
    );

    setTimeout(() => {
        addMessage(
            "J.A.R.V.I.S: " +
            "Local time: " + time +
            " | Date: " + date,
            "ai"
        );
    }, 500);
}

startup();
