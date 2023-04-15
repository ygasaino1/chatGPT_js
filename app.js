const express = require("express");
const app = express();
const port = 3000;
let cli_cache = {};

let socket_id = {};
let socket_ip = {};
let attempt_id = 5;
let attempt_ip = 4;


//middlewares
app.use(express.static("public"));

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

let users = {
    "user1": {
        intro_: [
            { role: "assistant", content: "what kind of tone and phrases should i use?" },
            { role: "user", content: "just use casual pharses and try to have a friendly tone." },
            { role: "assistant", content: "ok, got it. How can I assist you today?" },
            { role: "user", content: "noo, no more how can i assist you today sentences!" },
            { role: "assistant", content: "okokok, it was out of habbit lol, i totaly got it." },
        ],
        intro: [],
        key: process.env.ID1,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user2": {
        intro_: [],
        intro: [],
        key: process.env.ID2,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user3": {
        intro_: [],
        intro: [],
        key: process.env.ID3,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user4": {
        intro_: [],
        intro: [],
        key: process.env.ID4,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user5": {
        intro_: [],
        intro: [],
        key: process.env.ID5,
        apiKey: process.env.OPENAI_API_KEY1
    }
};
for (let u in users) {
    users[u].intro = [...users[u].intro_];
}

//----------------chatGpt:
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY1,
});

const openai = new OpenAIApi(configuration);
let history_new = {};

async function user_input_func(user_input, user, callback) {
    // history_new[user].push({ role: "user", content: user_input });
    try {
        openai.configuration.apiKey = users[user].apiKey;
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [...users[user].intro, ...history_new[user], { role: "user", content: user_input }],
        });

        const completion_text = completion.data.choices[0].message.content;
        history_new[user].push({ role: "user", content: user_input }, { role: "assistant", content: completion_text });
        let return_ = '█▓▒░ ' + completion_text + '\n';
        callback(return_);
    } catch (error) {
        // Consider adjusting the error handling logic for your use case
        if (error.response) {
            let return_ = JSON.stringify(error.response.data, null, 2);
            callback(return_);
        } else {
            let return_ = `Error with OpenAI API request: ${error.message}`;
            callback(return_);
        }
    }
}

//----------------socket.io instantiation
const io = require("socket.io")(server);

//////STDin/out
// const originalStdoutWrite = process.stdout.write;
// const originalStderrWrite = process.stderr.write;

// process.stdout.write = (chunk, encoding, callback) => {
//     io.emit("cli_out", chunk.toString());
//     originalStdoutWrite.apply(process.stdout, [chunk, encoding, callback]);
// };

// process.stderr.write = (chunk, encoding, callback) => {
//     io.emit("cli_out", chunk.toString());
//     originalStderrWrite.apply(process.stderr, [chunk, encoding, callback]);
// };

let getUser = function(d) { //{"key":"12hj4jk1"}
    let user = "";
    try {
        if (!("key" in d)) { return ""; }
        for (let uName in users) {
            if (users[uName].key == d.key) { user = uName; }
        }
        return user;
    } catch (e) {
        return "";
    }
}

io.on("connection", (socket) => {

    ////////////////SECURITY
    socket_id[socket.id] = { attempt: 0 };
    const ipReg = /\d*.\d*.\d*.\d*/;
    let clientIP = socket.request.headers["x-forwarded-for"];
    if (ipReg.test(clientIP)) { clientIP = clientIP.match(/\d*.\d*.\d*.\d*/)[0]; } else { clientIP = "no-ip"; }
    if (!(clientIP in socket_ip)) { socket_ip[clientIP] = { id: null, attempt: 0 }; }
    if (clientIP in socket_ip && socket_ip[clientIP].attempt > attempt_ip) {
        socket.emit("cli_out", `\n!SUSPICIOUS TRAFFIC DETECTED!\n!YOU ARE BLOCKED FROM USING MY CLIENT!\n!CLOSE YOUR TAB AND WAIT FOR A WHILE.!`);
        socket.disconnect();
    }

    //----------------CONSOLE---------------------------->
    socket.on("cli_init", (d) => {
        console.log("💻 CLI/Console Connected! 🤦‍♀️");
        socket.emit("cli_key", "");
    });

    socket.on("cli_key_check", d => {
        try {
            let user = getUser(d);
            if (user == "") { //-----------------------------------WRONG Answer>
                socket_id[socket.id].attempt += 1;
                if (socket_ip[clientIP].id != socket.id) {
                    socket_ip[clientIP].id = socket.id;
                    socket_ip[clientIP].attempt += 1;
                }
                if (socket_id[socket.id].attempt < attempt_id) {
                    socket.emit("cli_key", "");
                    return;
                } else {
                    socket.disconnect();
                    return;
                }
            } else { //-------------------------------------------CORRECT Answer>
                socket.emit("cli_uname", user);
            }
            //[SAFETY] innitiation check of each user
            if (!(user in history_new)) { history_new[user] = []; }

            let temp = "";
            [...users[user].intro, ...history_new[user]].forEach(msg => {
                try {
                    temp += msg.role == 'user' ? '\n\n> ' : '\n█▓▒░ ';
                    temp += msg.content;
                } catch (e) {}
            });
            if (temp == "") { temp = "No Previous Chat Available." }
            socket.emit("cli_out", `\nCHAT HISTORY:\n${temp}\n`);
        } catch (e) {
            socket.emit("cli_out", e.toString());
        }
    });

    socket.on("cli_in", (d) => {
        try {
            let user = getUser(d);
            if (user == "") { return; }
            //[SAFETY] innitiation check of each user
            if (!(user in history_new)) { history_new[user] = []; }

            if (!("cmd" in d)) { return; }
            if (!("role" in d)) { return; }
            if (!("content" in d)) { return; }
            // now list of commands:
            try {
                if (d["cmd"] == "clear") {
                    users[user].intro = [];
                    history_new[user] = [];
                    socket.emit("cli_out", `# [${user}]: CHAT HISTORY IS EMPTY.`);
                } else if (d["cmd"] == "reset") {
                    users[user].intro = [...users[user].intro_];
                    history_new[user] = [];
                    let temp = "";
                    users[user].intro.forEach(msg => {
                        try {
                            temp += msg.role == 'user' ? '\n\n> ' : '\n█▓▒░ ';
                            temp += msg.content;
                        } catch (e) {}
                    });
                    socket.emit("cli_out", `\nCHAT HISTORY:\n${temp}\n`);
                } else if (d["cmd"] == "direct") {
                    let temp = { role: d['role'], content: d['content'] }
                    history_new[user].push(temp);
                    socket.emit("cli_out", JSON.stringify(temp, null, 2));
                } else if (d["cmd"] == "chat") {
                    user_input_func(d['content'], user, (comp) => {
                        socket.emit("cli_out", comp);
                    });
                }
            } catch (e) {
                socket.emit("cli_out", e.toString());
            }
        } catch (e) {
            socket.emit("cli_out", "ACCESS_DENIED!");
        }
    });
});