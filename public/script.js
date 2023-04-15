let console_key = "";
let need_key = false;
let snapshot = "";


let input = document.querySelector('#input');
let output = document.querySelector('#output');
let output_container = document.querySelector('#output_container');
let uname = document.querySelector('#uname');

input.focus();

setTimeout(() => {
    //.classList.add('init');
    document.querySelector('#overlay').classList.add('init');
    document.querySelector('#container').classList.add('init');
}, 1000);

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
/// up and down cmd cache browse ///////////////

let cmd_cache_max = 20
let cmd_cache_currentindex = -1;
let cmd_cache = [];

function cmd_cache_add(str) {
    cmd_cache.unshift(str);
    if (cmd_cache.length > cmd_cache_max) { cmd_cache.pop(); }
}

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

document.addEventListener("keydown", function(event) {
    if (event.key === "Enter" & document.activeElement != input) {
        input.focus();
    }
});
input.addEventListener("keydown", function(event) { // enter
    if (event.key === "Enter") {
        event.preventDefault();
        if (input.value == "") {
            output.innerText = output.innerText + "\n#";
            return;
        }
        let content = input.value;
        if (need_key) {
            console_key = content;
            need_key = false;
            input.setAttribute('type', 'text');
            output.innerText = output.innerText + " :SAVED"
            socket.emit('cli_key_check', { "key": content });
        } else if (content.toLowerCase() == "/clear") {
            output.innerText = "";
            socket.emit('cli_in', { key: console_key, cmd: "clear", role: "user", content: "" });
        } else if (content.toLowerCase() == "/reset") {
            output.innerText = "";
            socket.emit('cli_in', { key: console_key, cmd: "reset", role: "user", content: "" });
        } else {
            output.innerText = output.innerText + `\n> ${input.value}`;
            try {
                if (event.shiftKey) {
                    let role = prompt("Direct Data Injection\nEnter Role Name (system / user / assistant)", "assistant");
                    role = role.toLowerCase();
                    if (role != null && (role == "system" || role == "user" || role == "assistant")) {
                        socket.emit('cli_in', { key: console_key, cmd: "direct", role: role, content: content });
                    }
                } else {
                    socket.emit('cli_in', { key: console_key, cmd: "chat", role: "user", content: content });
                }
            } catch {}
        }
        output.scrollIntoView(0);
        input.value = "";
        cmd_cache_add(content);
        cmd_cache_currentindex = -1;
    } else if (event.key === "ArrowUp") { // cache up
        event.preventDefault();
        cmd_cache_currentindex++;
        if (cmd_cache_currentindex > (cmd_cache.length - 1)) { cmd_cache_currentindex = 0; }
        input.value = cmd_cache[cmd_cache_currentindex];
    } else if (event.key === "ArrowDown") { // cache down
        event.preventDefault();
        cmd_cache_currentindex--;
        if (cmd_cache_currentindex < 0) { cmd_cache_currentindex = (cmd_cache.length - 1); }
        input.value = cmd_cache[cmd_cache_currentindex];
    } else {
        // we are typing...
        if (need_key) {
            output.innerText = snapshot + "●".repeat((input.value.length % 4) + 1);
        }
    }
});

function key_request() {
    need_key = true;
    input.setAttribute('type', 'password');
    output.innerText = output.innerText + `\n\nENTER KEY: `;
    snapshot = output.innerText;
}
socket.on('cli_key', d => {
    key_request();
});
socket.on('cli_out', data => { //data is a string
    try {
        output.innerText = output.innerText + `\n${data}`;
        if (data == "ACCESS_DENIED!") {
            key_request();
        }
    } catch {}
});
// socket.on('cli_history', data => {
//     try {
//         let temp = document.createElement('div');
//         temp.id = "history";
//         temp.innerText = data;
//         output.innerHTML = output.innerHTML + temp.outerHTML;
//     } catch {}
// })

socket.on("cli_uname", d => {
    output.innerText = output.innerText + `\n# WELCOME BACK @${d}`;
    uname.innerText = `${d}@chat-123`;
});