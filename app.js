const express = require("express");
const app = express();
const port = 3000;
let cli_cache = {};


//middlewares
app.use(express.static("public"));

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

let users = {
    "user1": {
        intro: [
            { role: "assistant", content: "what kind of tone and phrases should i use?" },
            { role: "user", content: "just use casual pharses and try to have a friendly tone." },
            { role: "assistant", content: "ok, got it." }
        ],
        key: process.env.ID1,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user2": {
        intro: [],
        key: process.env.ID2,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user3": {
        intro: [],
        key: process.env.ID1,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user4": {
        intro: [],
        key: process.env.ID1,
        apiKey: process.env.OPENAI_API_KEY1
    },
    "user5": {
        intro: [],
        key: process.env.ID1,
        apiKey: process.env.OPENAI_API_KEY1
    }
};
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
            messages: [{ role: "user", content: user_input }, ...history_new[user]],
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

    //----------------CONSOLE---------------------------->
    socket.on("cli_init", (d) => {
        console.log("💻 CLI/Console Connected! 🤦‍♀️");
        socket.emit("cli_key", "");
    });

    socket.on("cli_key_check", d => {
        try {
            let user = getUser(d);
            if (user == "") {
                socket.emit("cli_key", "");
                return;
            } else {
                socket.emit("cli_uname", user);
            }
            //[SAFETY] innitiation check of each user
            if (!(user in history_new)) {
                history_new[user] = users[user].intro;
            }

            let temp = "";
            history_new[user].forEach(msg => {
                try {
                    temp += msg.role == 'user' ? '\n>' : '\n';
                    temp += msg.content;
                } catch (e) {}
            });
            if (temp == "") { temp = "No Previous Chat Available." }
            socket.emit("cli_out", `\nCHAT HISTORY:\n${temp}`);
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
                    delete history_new[user];
                    socket.emit("cli_out", "# CHAT HISTORY CLEARED.");
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