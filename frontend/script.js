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
        cmd === "hey rolex" ||
        cmd === "hello rolex"
    ) {
        return "Hello Boss. Rolex AI is ready.";
    }

    if (
        cmd.includes("status") ||
        cmd.includes("system status")
    ) {
        return "All Rolex AI local systems are operational.";
    }

    if (cmd === "time" || cmd.includes("what time")) {
        return `Current time is ${getTime()}.`;
    }

    if (cmd === "date" || cmd.includes("today's date")) {
        return `Today's date is ${getDate()}.`;
    }

    if (cmd === "help" || cmd.includes("what can you do")) {
        return "I can currently handle Hello, Status, Time, Date and Help in local mode.";
    }

    if (cmd.includes("who are you")) {
        return "I am Rolex AI, your personal local intelligence interface.";
    }

    if (cmd.includes("are you online")) {
        return "Yes Boss. Rolex AI interface is online. AI services are not connected yet.";
    }

    return "Command received, Boss. Rolex AI is currently running in local demo mode.";
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
        sendCommand();
    }
});

/* VOICE ENGINE */

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
        voiceButton.textContent = "🎙 LISTENING...";
        addMessage("ROLEX AI", "Listening, Boss...");
    };

    recognition.onresult = (event) => {
        const spokenText =
            event.results[0][0].transcript;

        input.value = spokenText;

        addMessage("YOU", spokenText);

        setTimeout(() => {
            addMessage(
                "ROLEX AI",
                processCommand(spokenText)
            );
        }, 300);
    };

    recognition.onerror = (event) => {
        addMessage(
            "ROLEX AI",
            `Voice error: ${event.error}`
        );
    };

    recognition.onend = () => {
        voiceButton.textContent = "🎙 VOICE";
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

function startup() {
    addMessage(
        "ROLEX AI",
        "Systems initialized, Boss."
    );

    addMessage(
        "ROLEX AI",
        `Local time: ${getTime()}`
    );
}

startup();
