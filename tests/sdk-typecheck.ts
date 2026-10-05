import { generateText, Output } from 'ai';
import { z } from 'zod';
// Compile-only validation of the installed AI SDK structured-output API.
export function checkSdk() {
 return generateText({model:'openai/gpt-6.1-sol',system:'Marketing consultant',messages:[{role:'user',content:'Hello'}],output:Output.object({schema:z.object({reply:z.string()})}),maxOutputTokens:1800,maxRetries:0,abortSignal:AbortSignal.timeout(45000)});
}
