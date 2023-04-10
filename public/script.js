let console_key = "";
let need_key = false;
let snapshot = "";

let input = document.querySelector('#input');
let output = document.querySelector('#output');
let output_container = document.querySelector('#output_container');

input.focus();

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

document.addEventListener("keydown", function() {
    if (event.key === "Enter" & document.activeElement != input) {
        input.focus();
    }
});
input.addEventListener("keydown", function(event) { // enter
    if (event.key === "Enter") {
        event.preventDefault();
        if (input.value == "") { return; }
        let cmd = input.value;
        if (need_key) {
            console_key = cmd;
            need_key = false;
            output.innerText = output.innerText + " :SAVED"
        } else if (cmd == "clear") {
            output.innerText = "";
        } else {
            output.innerText = output.innerText + `\n> ${input.value}`;
            try {
                if (event.shiftKey) {
                    socket.emit('cli_in', { key: console_key, cmd: cmd, role: "system" });
                } else { socket.emit('cli_in', { key: console_key, cmd: cmd, role: "user" }); }
            } catch {}
        }
        output.scrollIntoView(0);
        input.value = "";
        cmd_cache_add(cmd);
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
    output.innerText = output.innerText + `\nENTER KEY: `;
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