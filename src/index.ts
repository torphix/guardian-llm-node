import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export enum Requirements {
  hallucinationChecker = 'Your output is based off of the data provided, if the information is not in the data respond with "I don\'t know"',
}

export interface Props {
  model: string;
  messages: { role: string, content: string }[];
  maxTokens?: number;
  maxRetries?: number;
  instructionPrompt?: string;
  outputFormat?: Record<string, any>;
  outputSpecification?: Record<string, any>;
  outputRequirements?: string[];
  checkOutput?: boolean;
  retryModel?: string;
}

export async function createChatCompletion(props: Props): Promise<any> {
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
  let instructionPrompt = props.instructionPrompt || '';
  const retryModel = props.retryModel || props.model;
  // Build the instruction prompt
  if (props.outputFormat) {
    instructionPrompt += `\nYou must return your response in the following format: ${JSON.stringify(props.outputFormat)}`;
    instructionPrompt += `\nHere is a specification for the JSON object: ${JSON.stringify(props.outputSpecification)}`;
  }
  if (props.outputRequirements) {
    instructionPrompt += `\nYour response must conform to the following requirements: ${props.outputRequirements.join(', ')}`;
  }
  // Insert instruction prompt after the system prompt if it exists if not then insert as first
  if (props.messages[0].role === 'system') {
    props.messages.splice(1, 0, { role: 'user', content: instructionPrompt });
  } else {
    props.messages.splice(0, 0, { role: 'user', content: instructionPrompt });
  }
  console.log(props.messages);
  // Retry with exponential backoff (429 error code)
  let retries = 0;
  let maxRetries = props.maxRetries || 5;
  while (retries < maxRetries) {
    try {

      var response = await openai.createChatCompletion({
        model: props.model,
        messages: props.messages as ChatCompletionRequestMessage[],
        max_tokens: props.maxTokens,
        stream: false,
      });
      var responseData = await response.json()
      var responseMessage = responseData.choices[0].message.content ?? '';
      var output = await parseJSON(responseMessage);
      var errors: string[] = [];
      // Check the format is correct
      if (props.outputSpecification) {
        errors = outputFormatChecker(output, props.outputSpecification)
      }
      console.log(errors);
      if (errors.length > 0) {
        output = await correctOutputFormat(props.messages, errors, output, props.outputSpecification!, retryModel);
        if (outputFormatChecker(output, props.outputSpecification!).length > 0) {
          throw new Error(`Unable to correct the output: ${output}. Please try with a different retry model.`);
        }
      }
      // Check the output meets the requirements
      if (props.checkOutput) {
        output = await correctOutputRequirements(props.messages, JSON.stringify(output), props.outputRequirements!);
      }
      return output;
    } catch (error: any) {
      if (error.code === 429) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 2 ** retries * 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Encountered rate limits. Unable to complete the chat request after ${maxRetries} retries.`);
}

function propsChecker(props: Props) {
  if (props.outputFormat && !props.outputSpecification) {
    throw new Error('You must provide an output specification if you provide an output format');
  }
}

function outputFormatChecker(outputJSON: Record<string, any>, outputSpecification: Record<string, any>): string[] {
  // Parse the output into a JSON object and check that it matches the output specification
  const outputKeys = Object.keys(outputJSON);
  const outputSpecKeys = Object.keys(outputSpecification);
  var errors: string[] = [];
  // Check if all keys in the output exist in the specification
  for (let key of outputKeys) {
    if (!outputSpecKeys.includes(key)) {
      errors.push(`Unexpected key '${key}' in the output.`);
    }
  }

  // Check if all keys in the specification exist in the output and match their types
  for (let key of outputSpecKeys) {
    if (!outputKeys.includes(key)) {
      errors.push(`Expected key '${key}' missing from the output.`);
    } else {
      const expectedType = outputSpecification[key].type;
      if (typeof outputJSON[key] !== expectedType) {
        errors.push(`Expected type for key '${key}' is '${expectedType}', but got '${typeof outputJSON[key]}'.`);
      }
    }
  }

  return errors;
}


async function parseJSON(output: string): Promise<Record<string, any>> {
  try {
    return JSON.parse(output);
  } catch (error) {
    const prompt = `Your task is to fix the following invalid JSON:
\n${output}\n\n
Return nothing else in your response except the corrected output.`;
    const messages = [
      { role: 'user', content: prompt },
    ]
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages as ChatCompletionRequestMessage[],
    });
    var responseData = await response.json()
    const retryOutput = responseData.choices[0].message.content ?? '';
    try {
      return JSON.parse(retryOutput);
    } catch (error) {
      throw new Error(`Unable to correct the JSON output: ${output}.`);
    }
  }
}


async function correctOutputFormat(messages: { role: string, content: string }[], errors: string[], output: Record<string, any>, outputSpecification: Record<string, any>, retryModel: string): Promise<Record<string, any>> {
  const prompt = `Your task is to correct the following errors in the output:
\n${errors.join('\n')}\n\n${JSON.stringify(output)} so that it matches the output specification:
\n${JSON.stringify(outputSpecification)}\n\n
Return nothing else in your response except the corrected output.`;
  messages.push({ role: 'user', content: prompt })
  const response = await openai.createChatCompletion({
    model: retryModel,
    messages: messages as ChatCompletionRequestMessage[],
  });

  var responseData = await response.json()
  const retryOutput = responseData.choices[0].message.content ?? '';
  try {
    return JSON.parse(retryOutput);
  } catch (error) {
    throw new Error(`Unable to correct the JSON output: ${output}. Please try with a different retry model.`);
  }
}





async function correctOutputRequirements(messages: { role: string, content: string }[], output: string, outputRequirements: string[]): Promise<Record<string, any>> {
  const prompt = `Your task is to check if the following output:
\n${output}\n\n
meets the following requirements:
\n${outputRequirements.join('\n')}\n\n
If the output does not meet the requirements, you should correct it so that it does.`;
  messages.push({ role: 'user', content: prompt })
  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messages as ChatCompletionRequestMessage[],
  });

  var responseData = await response.json()
  const retryOutput = responseData.choices[0].message.content ?? '';
  try {
    return JSON.parse(retryOutput);
  }
  catch (error) {
    throw new Error(`Unable to correct the JSON output: ${output}.`);
  }
}