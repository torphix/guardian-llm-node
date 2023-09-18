# Description
A package to auto correct outputs from Large language models (LLMs). It does the following:
- Auto retry when encountering ratelimits with exponential back offs
- Builds an instruction prompt that is inserted after the system prompt
- Instruction prompt specifies what the output format should be as well as the specification
- Auto corrects invalid outputs that don't meet the specification
- Optionally check if the output meets the specified requirements eg: Ensure that the response ends with a question


## How it works
1. Set your OPENAI_API_KEY as an env variable
2. Use the package like this:
```typescript
import { createChatCompletion } from 'guardian-llm'

// All the usual args:
const model = "gpt-3.5-turbo"
const messages = [{ role: 'user', content: '你好你好吗' }]

// Additional Args
// Instruction prompt is added as the first message (after system prompt)
const instructionPrompt: `You are a chinese university student your name is ming. Respond only in JSON format.
You are in a conversation with a student.
You should only use vocabulary at HSK-1 level`

// Specify output JSON object format
const outputFormat = {
        'chinese': "",
        "english": ""
    }

// Specify the types and property descriptions (follows the OpenAI function calling spec)
const outputSpecification = {
        "chinese": {
            "type": "string",
            "description": "Your response to the user in chinese"
        },
        "english": {
            "type": "string",
            "description": "A translation of your response to the user in english"
        }
    }

// Requirements 
const outputRequirements = ['you must end your response with a question to the user']

// This can be left undefined it simply checks if the output meets the outputRequirements
// useful if you want to check for hallcuinations when input data is provided etc..
const checkOutput = true;

const response: Record<string, any> = await createChatCompletion(
    model,
    messages,
    instructionPrompt,
    outputFormat,
    outputSpecification,
)
```

The instruction prompt looks like (based off of above example):

```javascript
const instructionPrompt = `You are a chinese university student your name is ming. Respond only in JSON format.
You are in a conversation with a student.
You should only use vocabulary at HSK-1 level

You must return your response in the following format:
{
    "chinese": "",
    "english": ""
}
Here is a specification for the JSON object: 
{
    "chinese": {
        "type": "string",
        "description": "Your response to the user in chinese"
    },
    "english": {
        "type": "string",
        "description": "A translation of your response to the user in english"
    }
}
Your response must conform to the following requirements: you must end your response with a question`
```

# Issues & Feature requests
- Open an issue if you encounter a problem
- Open an issue if you want a feature (or make a pull request)


# References
Thanks to ShreyaR and their python package guardrails: https://github.com/ShreyaR/guardrails