"use server";

import { OpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { OutputParserException, StringOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { Change, diffWords, diffWordsWithSpace } from "diff";
import { Suggestion } from "../types";

const parser = StructuredOutputParser.fromNamesAndDescriptions({
    editedText: "The text after you have edited it according to the provided prompt",
    errorMessage: "An error message if it was impossible to edit the text according to the prompt"
})

const chain = RunnableSequence.from([
    PromptTemplate.fromTemplate(
        `You are editing some text written by a human user.
        The human has given you the following prompt for editing the text: '{prompt}'.
        The original text is:
        \`\`\`{original_text}\`\`\`
        If it is possible to edit the text according to the prompt, respond with only the edited text with no surrounding quotation marks.
        If you do not understand the prompt, respond with the string "ERROR: " (without the quotation marks) followed by an error message to show to the user.`
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

        const startNewGroup = () => {

            console.log("-----");

            groups.push(currentGroup);
            currentGroup = [];
        }

        if (change.added || change.removed) {

            if (currentGroup.length > 0) {

                const prevChange = currentGroup[currentGroup.length - 1];

                // If previous text was not a change and contained text other than spaces, start a new group
                if (!prevChange.added && !prevChange.removed && prevChange.value.trim()) {
                
                    startNewGroup();
                }

                if (prevChange.added || prevChange.removed) {

                    if (prevChange.value[prevChange.value.length - 1] === "\n") {

                    }
                }
            }

        } else {

            if (currentGroup.length > 0) {

                if (!change.value.trim() && i + 1 < changes.length) {

                    const nextChange = changes[i + 1];

                    // If current value is a space and next value is not a change, start a new group
                    if (!nextChange.added && !nextChange.removed) {

                        startNewGroup();
                    }

                } else {

                    startNewGroup();
                }
            }
        }

        console.log(change);
        currentGroup.push(change);
    }

    groups.push(currentGroup);

    return groups;
}

function combineGroups(groups: Change[][]): Suggestion[] {

    const edits = [];
    let currentCharacter = 0;

    for (const group of groups) {

        let startCharacter = currentCharacter;
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

        // if (newText.includes("\n")) continue;

        // while (originalText.startsWith("\n")) {
        //     originalText = originalText.slice(1);
        //     startCharacter++;
        // }

        // while (originalText.endsWith("\n")) {
        //     originalText = originalText.slice(0, -1);
        //     endCharacter--;
        // }

        // if (originalText.includes("\n") || originalText == newText) continue;

        (group.length > 1 || group[0].added || group[0].removed) && edits.push({startCharacter, endCharacter, originalText, newText});
    }

    return edits;
}

export type EditTextResponse = {
    error: boolean;
    errorMessage: string | null;
    suggestions: Suggestion[];
}

export async function editText(prompt: string, original_text: string): Promise<EditTextResponse> {

    return chain.invoke({prompt, original_text}).then(res => {
            
        const error = res.slice(0, 7) === "ERROR: ";
        const errorMessage = error ? res.slice(7) : null;
        const suggestions = error ? [] : combineGroups(groupChanges(diffWordsWithSpace(original_text, res)));

        return {
            error,
            errorMessage,
            suggestions
        }
    });
}