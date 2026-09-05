// ================================
// ROLEX AI — MOBILE COMMAND ENGINE
// ================================

const chat = document.getElementById("chat");

const input =
    document.getElementById("commandInput") ||
    document.querySelector("input[type='text']") ||
    document.querySelector("input");

const sendButton =
    document.getElementById("sendButton") ||
    document.querySelector("button");

const voiceButton =
    document.getElementById("voiceButton") ||
    [...document.querySelectorAll("button")]
        .find(btn => btn.textContent.toLowerCase().includes("voice"));

// -------------------------------
// CHAT
// -------------------------------

function addMessage(sender, text) {

    if (!chat) return;

    const message = document.createElement("div");

    message.className = "message";

    message.innerHTML =
        `<span>${sender}:</span> ${text}`;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}


// -------------------------------
// LOCAL DATA
// -------------------------------

function getTime() {

    return new Date().toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function getDate() {

    return new Date().toLocaleDateString(
        "en-IN"
    );
}


// -------------------------------
// ROLEX COMMAND BRAIN
// -------------------------------

function processCommand(command) {

    const cmd =
        command
            .toLowerCase()
            .trim();


    if (
        cmd === "hello" ||
        cmd === "hi" ||
        cmd.includes("hello rolex") ||
        cmd.includes("hey rolex")
    ) {

        return "Hello Boss. Rolex AI is ready.";
    }


    if (
        cmd.includes("status") ||
        cmd.includes("system status")
    ) {

        return "All Rolex AI local systems are operational.";
    }


    if (
        cmd === "time" ||
        cmd.includes("what time")
    ) {

        return `Current time is ${getTime()}.`;
    }


    if (
        cmd === "date" ||
        cmd.includes("today")
    ) {

        return `Today's date is ${getDate()}.`;
    }


    if (
        cmd === "help" ||
        cmd.includes("help me")
    ) {

        return "Available commands: Hello, Status, Time, Date and Help.";
    }


    if (cmd.includes("who are you")) {

        return "I am Rolex AI, your personal local intelligence interface.";
    }


    if (
        cmd.includes("are you online") ||
        cmd.includes("online")
    ) {

        return "Yes Boss. Rolex AI interface is online.";
    }


    return "Command received, Boss. Rolex AI is running in local demo mode.";
}


// -------------------------------
// SEND COMMAND
// -------------------------------

function sendCommand() {

    if (!input) {

        alert("Rolex input box not found.");

        return;
    }


    const command =
        input.value.trim();


    if (!command) return;


    addMessage("YOU", command);


    input.value = "";


    setTimeout(() => {

        const reply =
            processCommand(command);

        addMessage(
            "ROLEX AI",
            reply
        );

    }, 300);
}


// -------------------------------
// SEND BUTTON
// -------------------------------

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendCommand
    );

}


// -------------------------------
// ENTER KEY
// -------------------------------

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


// ================================
// VOICE
// ================================

let recognition = null;


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.lang = "en-IN";


    recognition.onstart = function() {

        if (voiceButton) {

            voiceButton.textContent =
                "🎙 LISTENING...";

        }

        addMessage(
            "ROLEX AI",
            "Listening, Boss..."
        );

    };


    recognition.onresult =
        function(event) {

            const spokenText =
                event
                    .results[0][0]
                    .transcript;


            if (input) {

                input.value =
                    spokenText;

            }


            addMessage(
                "YOU",
                spokenText
            );


            setTimeout(() => {

                addMessage(
                    "ROLEX AI",
                    processCommand(
                        spokenText
                    )
                );

            }, 300);

        };


    recognition.onerror =
        function(event) {

            addMessage(
                "ROLEX AI",
                "Voice error: " +
                event.error
            );

        };


    recognition.onend =
        function() {

            if (voiceButton) {

                voiceButton.textContent =
                    "🎙 VOICE";

            }

        };


    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            function() {

                try {

                    recognition.start();

                } catch (error) {

                    console.log(error);

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
                    "ROLEX AI",
                    "Voice recognition is not supported in this browser."
                );

            }
        );

    }

}


// ================================
// STARTUP
// ================================

addMessage(
    "ROLEX AI",
    "Systems initialized, Boss."
);

addMessage(
    "ROLEX AI",
    `Local time: ${getTime()}`
);
