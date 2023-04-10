const express = require('express')
const app = express()
const port = 3000

let cli_cache = {};

//middlewares
app.use(express.static("public"));

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const history = [];



//socket.io instantiation
const io = require("socket.io")(server);
io.on("connection", (socket) => {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;

    process.stdout.write = (chunk, encoding, callback) => {
        socket.emit('cli_out', chunk.toString());
        originalStdoutWrite.apply(process.stdout, [chunk, encoding, callback]);
    };

    process.stderr.write = (chunk, encoding, callback) => {
        socket.emit('cli_out', chunk.toString());
        originalStderrWrite.apply(process.stderr, [chunk, encoding, callback]);
    };

    //----------------chatGpt:
    async function user_input_func(user_input) {
        const messages = [];
        for (const [input_text, completion_text] of history) {
            messages.push({ role: "user", content: input_text });
            messages.push({ role: "assistant", content: completion_text });
        }

        messages.push({ role: "user", content: user_input });

        try {
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages,
            });

            const completion_text = completion.data.choices[0].message.content;
            console.log(completion_text);

            history.push([user_input, completion_text]);
        } catch (e) {
            console.log(e.toString());
        }
    }
    //----------------CONSOLE---------------------------->
    socket.on("cli_init", (d) => {
        console.log('💻 CLI/Console Connected! 🤦‍♀️');
        socket.emit('cli_key', '')
    })
    socket.on("cli_in", (d) => {
        try {
            if ("key" in d && "cmd" in d) {
                if (d["key"] == process.env.CONSOLE_KEY) {
                    try {
                        user_input_func(d["cmd"]);
                    } catch (e) {
                        socket.emit('cli_out', e.toString());
                    }
                } else {
                    socket.emit("cli_out", "ACCESS_DENIED!")
                }
            }
        } catch (e) {
            console.log("CONSOLE_ERROR!")
        }
    });
    //----------------CONSOLE----------------------------<
});