const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendButton = document.getElementById("send");
const voiceButton = document.getElementById("voiceButton");

function addMessage(sender, text) {
    const message = document.createElement("div");
    message.className = "message";
    message.innerHTML = `<span>${sender}:</span> ${text}`;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
}

function getTime() {
    return new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getDate() {
    return new Date().toLocaleDateString("en-IN");
}

function processCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (cmd === "hello" || cmd === "hi" || cmd.includes("hello rolex")) {
        return "Hello Boss. Rolex AI is ready.";
    }

    if (cmd.includes("status")) {
        return "All Rolex AI local systems are operational.";
    }

    if (cmd === "time" || cmd.includes("what time")) {
        return `Current time is ${getTime()}.`;
    }

    if (cmd === "date" || cmd.includes("today")) {
        return `Today's date is ${getDate()}.`;
    }

    if (cmd === "help") {
        return "Available commands: Hello, Status, Time, Date and Help.";
    }

    if (cmd.includes("who are you")) {
        return "I am Rolex AI, your personal local intelligence interface.";
    }

    return "Command received, Boss. Rolex AI is running in local demo mode.";
}

function sendCommand() {
    const command = input.value.trim();

    if (!command) return;

    addMessage("YOU", command);
    input.value = "";

    setTimeout(() => {
        addMessage("ROLEX AI", processCommand(command));
    }, 300);
}

sendButton.addEventListener("click", sendCommand);

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendCommand();
    }
});


/* VOICE */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
        voiceButton.innerHTML = "<span>●</span> LISTENING...";
        addMessage("ROLEX AI", "Listening, Boss...");
    };

    recognition.onresult = (event) => {

        const spokenText =
            event.results[0][0].transcript;

        input.value = spokenText;

        sendCommand();
    };

    recognition.onerror = (event) => {
        addMessage(
            "ROLEX AI",
            "Voice error: " + event.error
        );
    };

    recognition.onend = () => {
        voiceButton.innerHTML = "<span>●</span> VOICE";
    };

    voiceButton.addEventListener("click", () => {
        try {
            recognition.start();
        } catch (error) {
            console.log(error);
        }
    });

} else {

    voiceButton.addEventListener("click", () => {
        addMessage(
            "ROLEX AI",
            "Voice recognition is not supported by this browser."
        );
    });
}


/* STARTUP */

addMessage(
    "ROLEX AI",
    "Systems initialized, Boss."
);

addMessage(
    "ROLEX AI",
    `Local time: ${getTime()}`
);
