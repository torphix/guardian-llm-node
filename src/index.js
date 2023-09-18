"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.createChatCompletion = exports.Requirements = void 0;
var openai_edge_1 = require("openai-edge");
var config = new openai_edge_1.Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
var openai = new openai_edge_1.OpenAIApi(config);
var Requirements;
(function (Requirements) {
    Requirements["hallucinationChecker"] = "Your output is based off of the data provided, if the information is not in the data respond with \"I don't know\"";
})(Requirements = exports.Requirements || (exports.Requirements = {}));
function createChatCompletion(props) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var instructionPrompt, retryModel, retries, maxRetries, response, responseData, responseMessage, output, errors, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    /*
                    checkOutput:
                      - If true will check the output conforms to the outputRequirements
                      - Note that if the output dosn't match the outputSpecification will retry
                    instructionPrompt:
                      - The instruction prompt is added as the first message just after the system prompt
                        and is combined with the output format and specification to form the full prompt.
                    retryModel:
                      - If a retry is required due to the output not matching the outputSpecification / outputRequirements
                        the retryModel will be used instead of the original model. defaults to the same model as the original.
                  
                    Output format and output specification are added to the end of the instruction prompt as such:
                    """
                    You must return your response in the following format:
                    {outputFormat}
                    Your response must also conform to the following specification:
                    {outputSpecification}
                    """
                  
                    outputFormat: the JSON format of the output, e.g.:
                    {
                      "location": "Seattle",
                      "time": "10:00",
                      "temperature": 70
                    }
                    outputSpecification: follows the OpenAI function calling API spec:
                    {
                      "location": {
                        "type": "string",
                        "description": "location of the own"
                        },
                        "time": {
                              "type": "string",
                              "description": "time of the response in UTC"
                        },
                        "temperature": {
                              "type":"integer",
                              "description": "the temperature of the response"
                        }
                  }
                    */
                    propsChecker(props);
                    instructionPrompt = props.instructionPrompt || '';
                    retryModel = props.retryModel || props.model;
                    // Build the instruction prompt
                    if (props.outputFormat) {
                        instructionPrompt += "\nYou must return your response in the following format: ".concat(JSON.stringify(props.outputFormat));
                        instructionPrompt += "\nHere is a specification for the JSON object: ".concat(JSON.stringify(props.outputSpecification));
                    }
                    if (props.outputRequirements) {
                        instructionPrompt += "\nYour response must conform to the following requirements: ".concat(props.outputRequirements.join(', '));
                    }
                    // Insert instruction prompt after the system prompt if it exists if not then insert as first
                    if (props.messages[0].role === 'system') {
                        props.messages.splice(1, 0, { role: 'user', content: instructionPrompt });
                    }
                    else {
                        props.messages.splice(0, 0, { role: 'user', content: instructionPrompt });
                    }
                    console.log(props.messages);
                    retries = 0;
                    maxRetries = props.maxRetries || 5;
                    _b.label = 1;
                case 1:
                    if (!(retries < maxRetries)) return [3 /*break*/, 15];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 10, , 14]);
                    return [4 /*yield*/, openai.createChatCompletion({
                            model: props.model,
                            messages: props.messages,
                            max_tokens: props.maxTokens,
                            stream: false
                        })];
                case 3:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 4:
                    responseData = _b.sent();
                    responseMessage = (_a = responseData.choices[0].message.content) !== null && _a !== void 0 ? _a : '';
                    return [4 /*yield*/, parseJSON(responseMessage)];
                case 5:
                    output = _b.sent();
                    errors = [];
                    // Check the format is correct
                    if (props.outputSpecification) {
                        errors = outputFormatChecker(output, props.outputSpecification);
                    }
                    console.log(errors);
                    if (!(errors.length > 0)) return [3 /*break*/, 7];
                    return [4 /*yield*/, correctOutputFormat(props.messages, errors, output, props.outputSpecification, retryModel)];
                case 6:
                    output = _b.sent();
                    if (outputFormatChecker(output, props.outputSpecification).length > 0) {
                        throw new Error("Unable to correct the output: ".concat(output, ". Please try with a different retry model."));
                    }
                    _b.label = 7;
                case 7:
                    if (!props.checkOutput) return [3 /*break*/, 9];
                    return [4 /*yield*/, correctOutputRequirements(props.messages, JSON.stringify(output), props.outputRequirements)];
                case 8:
                    output = _b.sent();
                    _b.label = 9;
                case 9: return [2 /*return*/, output];
                case 10:
                    error_1 = _b.sent();
                    if (!(error_1.code === 429)) return [3 /*break*/, 12];
                    retries++;
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, Math.pow(2, retries) * 1000); })];
                case 11:
                    _b.sent();
                    return [3 /*break*/, 13];
                case 12: throw error_1;
                case 13: return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 1];
                case 15: throw new Error("Encountered rate limits. Unable to complete the chat request after ".concat(maxRetries, " retries."));
            }
        });
    });
}
exports.createChatCompletion = createChatCompletion;
function propsChecker(props) {
    if (props.outputFormat && !props.outputSpecification) {
        throw new Error('You must provide an output specification if you provide an output format');
    }
}
function outputFormatChecker(outputJSON, outputSpecification) {
    // Parse the output into a JSON object and check that it matches the output specification
    var outputKeys = Object.keys(outputJSON);
    var outputSpecKeys = Object.keys(outputSpecification);
    var errors = [];
    // Check if all keys in the output exist in the specification
    for (var _i = 0, outputKeys_1 = outputKeys; _i < outputKeys_1.length; _i++) {
        var key = outputKeys_1[_i];
        if (!outputSpecKeys.includes(key)) {
            errors.push("Unexpected key '".concat(key, "' in the output."));
        }
    }
    // Check if all keys in the specification exist in the output and match their types
    for (var _a = 0, outputSpecKeys_1 = outputSpecKeys; _a < outputSpecKeys_1.length; _a++) {
        var key = outputSpecKeys_1[_a];
        if (!outputKeys.includes(key)) {
            errors.push("Expected key '".concat(key, "' missing from the output."));
        }
        else {
            var expectedType = outputSpecification[key].type;
            if (typeof outputJSON[key] !== expectedType) {
                errors.push("Expected type for key '".concat(key, "' is '").concat(expectedType, "', but got '").concat(typeof outputJSON[key], "'."));
            }
        }
    }
    return errors;
}
function parseJSON(output) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var error_2, prompt_1, messages, response, responseData, retryOutput;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 1, , 4]);
                    return [2 /*return*/, JSON.parse(output)];
                case 1:
                    error_2 = _b.sent();
                    prompt_1 = "Your task is to fix the following invalid JSON:\n\n".concat(output, "\n\n\nReturn nothing else in your response except the corrected output.");
                    messages = [
                        { role: 'user', content: prompt_1 },
                    ];
                    return [4 /*yield*/, openai.createChatCompletion({
                            model: 'gpt-3.5-turbo',
                            messages: messages
                        })];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    responseData = _b.sent();
                    retryOutput = (_a = responseData.choices[0].message.content) !== null && _a !== void 0 ? _a : '';
                    try {
                        return [2 /*return*/, JSON.parse(retryOutput)];
                    }
                    catch (error) {
                        throw new Error("Unable to correct the JSON output: ".concat(output, "."));
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function correctOutputFormat(messages, errors, output, outputSpecification, retryModel) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var prompt, response, responseData, retryOutput;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prompt = "Your task is to correct the following errors in the output:\n\n".concat(errors.join('\n'), "\n\n").concat(JSON.stringify(output), " so that it matches the output specification:\n\n").concat(JSON.stringify(outputSpecification), "\n\n\nReturn nothing else in your response except the corrected output.");
                    messages.push({ role: 'user', content: prompt });
                    return [4 /*yield*/, openai.createChatCompletion({
                            model: retryModel,
                            messages: messages
                        })];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    responseData = _b.sent();
                    retryOutput = (_a = responseData.choices[0].message.content) !== null && _a !== void 0 ? _a : '';
                    try {
                        return [2 /*return*/, JSON.parse(retryOutput)];
                    }
                    catch (error) {
                        throw new Error("Unable to correct the JSON output: ".concat(output, ". Please try with a different retry model."));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function correctOutputRequirements(messages, output, outputRequirements) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var prompt, response, responseData, retryOutput;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prompt = "Your task is to check if the following output:\n\n".concat(output, "\n\n\nmeets the following requirements:\n\n").concat(outputRequirements.join('\n'), "\n\n\nIf the output does not meet the requirements, you should correct it so that it does.");
                    messages.push({ role: 'user', content: prompt });
                    return [4 /*yield*/, openai.createChatCompletion({
                            model: 'gpt-3.5-turbo',
                            messages: messages
                        })];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    responseData = _b.sent();
                    retryOutput = (_a = responseData.choices[0].message.content) !== null && _a !== void 0 ? _a : '';
                    try {
                        return [2 /*return*/, JSON.parse(retryOutput)];
                    }
                    catch (error) {
                        throw new Error("Unable to correct the JSON output: ".concat(output, "."));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
