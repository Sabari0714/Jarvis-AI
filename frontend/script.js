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

    addMessage("J.A.R.V.I.S: Processing...", "ai");

    setTimeout(() => {
        chat.lastElementChild.innerText =
            "J.A.R.V.I.S: Systems online. How may I assist you, Boss?";
    }, 1000);
}

function addMessage(text, type) {
    const message = document.createElement("div");

    message.className = "msg " + type;
    message.innerText = text;

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
      }
