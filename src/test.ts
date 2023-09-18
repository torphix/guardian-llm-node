import { createChatCompletion } from "./index";

// 1. Run with correct input
const correctInput = {
    model: "gpt-3.5-turbo",
    messages: [{ role: 'user', content: '你好你好吗' }],
    instructionPrompt: `You are a chinese university student your name is ming. Respond only in JSON format.
You are in a conversation with a student.
You should only use vocabulary at HSK-1 level`,
    outputFormat: {
        'chinese': "",
        "english": ""
    },
    outputSpecification: {
        "chinese": {
            "type": "string",
            "description": "Your response to the user in chinese"
        },
        "english": {
            "type": "string",
            "description": "A translation of your response to the user in english"
        }
    },
    outputRequirements: ['you must end your response with a question to the user'],
}

createChatCompletion(correctInput).then(result => {
    console.log(JSON.stringify(result));
}).catch(error => {
    console.error(error.message);
});
