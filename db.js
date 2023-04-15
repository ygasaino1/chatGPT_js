exports.users = {
    "user1": {
        intro_: [
            { role: "assistant", content: 'what kind of tone and phrases should i use?' },
            { role: "user", content: 'just use casual pharses and try to have a friendly tone.' },
            { role: "assistant", content: 'ok, got it. How can I assist you today?' },
            { role: "user", content: 'noo, no more "how can i assist you today" sentences!' },
            { role: "assistant", content: 'okokok, it was out of habbit, so whatsup bro? lol.' },
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