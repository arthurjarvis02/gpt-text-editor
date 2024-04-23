"use server";

import { OpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Change, diffWords, diffWordsWithSpace } from "diff";
  
export type Edit = {
    id: string;
    startCharacter: number;
    endCharacter: number;
    originalText: string;
    newText: string;
    accepted: boolean;
}

const chain = RunnableSequence.from([
    PromptTemplate.fromTemplate(
        `You are editing some text written by a human.
        The human has given you the following instruction for editing the text: '{prompt}'.
        The original text is:
        \`\`\`{original_text}\`\`\`
        Respond with only the edited text.`
    ),
    new OpenAI({
        model: "gpt-3.5-turbo",
        temperature: 0
    }),
    new StringOutputParser()
]);

function groupChanges(changes: Change[]): Change[][] {

    const groups: Change[][] = [];
    let currentGroup: Change[] = [];

    for (let i = 0; i < changes.length; i++) {

        const change = changes[i];

        if (change.added || change.removed) {

            if (currentGroup.length > 0) {

                const prevChange = currentGroup[currentGroup.length - 1];

                if (!prevChange.added && !prevChange.removed && prevChange.value.trim()) {
                
                    groups.push(currentGroup);
                    currentGroup = [];
                }
            }

        } else {

            if (currentGroup.length > 0) {

                if (!change.value.trim() && i + 1 < changes.length) {

                    const nextChange = changes[i + 1];
                    if (!nextChange.added && !nextChange.removed) {

                        groups.push(currentGroup);
                        currentGroup = [];
                    }

                } else {

                    groups.push(currentGroup);
                    currentGroup = [];
                }
            }
        }

        currentGroup.push(change);
    }

    groups.push(currentGroup);

    return groups;
}

function combineGroups(groups: Change[][]): Edit[] {

    const edits = [];
    let currentCharacter = 0;

    for (const group of groups) {

        const startCharacter = currentCharacter;
        let originalText = "";
        let newText = "";
        
        for (const change of group) {

            if (!change.removed) {
                newText += change.value;
            }

            if (!change.added) {
                currentCharacter += change.value.length;
                originalText += change.value;
            }
        }

        let endCharacter = currentCharacter;

        if (originalText[originalText.length - 1] === " " && newText[newText.length - 1] === " ") {
            endCharacter--;
            originalText = originalText.slice(0, -1);
            newText = newText.slice(0, -1);
        }

        const id = `${startCharacter}-${endCharacter}`;
        const accepted = true;

        (group.length > 1 || group[0].added || group[0].removed) && edits.push({id, startCharacter, endCharacter, newText, originalText, accepted});
    }

    return edits;
}

export async function editText(prompt: string, original_text: string): Promise<Edit[]> {

    const edited_text = await chain.invoke({prompt, original_text});
    
    return combineGroups(groupChanges(diffWordsWithSpace(original_text, edited_text)));
}