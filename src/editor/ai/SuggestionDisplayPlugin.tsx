"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { $deserializePoint, exportParagraphTextTree, ClientSuggestion } from "@/lib/types";
import { $constructParagraphTextTree, $findPointByCharacterIndex, $getEndPoint } from "@/lib/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createPoint, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isParagraphNode, $selectAll, LexicalNode, NodeKey, ParagraphNode, RangeSelection } from "lexical";
import { useEffect } from "react";
import SuggestionNode, { $createSuggestionNode, $isSuggestionNode } from "./SuggestionNode";
import { onceRendered, setAccepted, setOriginalContents } from "@/lib/features/ai/aiSlice";
import { deserialize } from "v8";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import { $createSpacerTextNode, $isSpacerTextNode } from "./SpacerTextNode";

export default function SuggestionDisplayPlugin() {

    const [editor] = useLexicalComposerContext();
    const suggestions = useAppSelector(state => state.ai.suggestions);
    const startPoint = useAppSelector(state => state.ai.startPoint);
    const rendered = useAppSelector(state => state.ai.rendered);
    const inAiMode = useAppSelector(state => state.ai.inAiMode);
    const dispatch = useAppDispatch();

    useEffect(() => {

        if (startPoint === undefined || !inAiMode) return;

        // Initial render

        if (rendered) {

            console.log("Already rendered, updating...");

            editor.update(() => {

                $selectAll();
                const allNodes = $getSelection()!.extract();

                if (allNodes.length === 1) {

                    while (allNodes[allNodes.length - 1].getKey() !== $getRoot().getKey()) {

                        allNodes.push(allNodes[allNodes.length - 1].getParentOrThrow());
                    }
                }
                
                const allSuggestionNodes = allNodes.filter($isSuggestionNode);

                for (const suggestion of suggestions) {

                    console.log("Upating suggestion", suggestion.id, suggestion.accepted);

                    const suggestionNodes = allSuggestionNodes.filter(node => node.suggestionId === suggestion.id);

                    console.log(allSuggestionNodes, suggestionNodes);

                    if (suggestionNodes.every(node => node.accepted === suggestion.accepted)) continue;

                    console.log("Different to state, so changing")

                    const first = suggestionNodes[0];
                    const firstParent = first.getParent();
                    if (!firstParent) return;

                    const last = suggestionNodes[suggestionNodes.length - 1];
                    const lastParent = last.getParent();
                    if (!lastParent) return;

                    const splice = $createRangeSelection();
                    splice.anchor = $createPoint(firstParent.getKey(), first.getIndexWithinParent(), "element");
                    splice.focus = $createPoint(lastParent.getKey(), last.getIndexWithinParent() + 1, "element");

                    console.log("Nodes in splice:", splice.getNodes());

                    const appendNodes: LexicalNode[] = [];

                    splice.getNodes().forEach(node => {

                        if ($isParagraphNode(node)) {

                            const children = node.getChildren();
                            const firstChild = children[0];

                            if ($isSuggestionNode(firstChild) && firstChild.suggestionId === suggestion.id) {

                                // Append children if this is last paragraph node
                                if (node.is(lastParent)) {

                                    console.log("Removing the last line")
                                    console.log("Appending", children.slice(1))

                                    appendNodes.push(...children.slice(1));
                                }

                                node.remove();
                            }

                        } else {
                                
                                node.remove();
                        }

                    });

                    $selectAll();

                    const insert = $createRangeSelection();
                    insert.anchor = splice.anchor;
                    insert.focus = splice.anchor;

                    const [nodes, firstSuggestionKey] = $createSuggestionNodes(suggestion, appendNodes);

                    console.log("Inserting at", insert);
                    console.log(nodes);

                    insert.insertNodes(nodes);
                }
            })

        } else {
            
            editor.update(() => {

                let updatedStartPoint = $deserializePoint(startPoint);
                let charOffset = 0;

                for (const suggestion of suggestions) {

                    console.log("Rendering suggestion", suggestion);

                    console.log("Start point", updatedStartPoint, "Start char", charOffset)

                    const selection = $createRangeSelection();
                    selection.anchor = updatedStartPoint;
                    selection.focus = $getEndPoint();

                    const extracted = selection.extract();
                    const tree = $constructParagraphTextTree(extracted);

                    let start = $findPointByCharacterIndex(tree, suggestion.startCharacter + charOffset);
                    let end = $findPointByCharacterIndex(tree, suggestion.endCharacter + charOffset);

                    console.log("Start:", start, "End:", end)

                    if (!start || !end) return;

                    const splice = $createRangeSelection();
                    splice.anchor = start;
                    splice.focus = end;

                    console.log("Original text:", splice.getTextContent())

                    const [nodes, firstSuggestionKey, totalFakeLength] = $createSuggestionNodes(suggestion);

                    let updateStart = false;
                    
                    if (start.is(updatedStartPoint)) {

                        console.log("Updating start point")
                        updateStart = true;

                        const startNode = $getNodeByKey(start.key)!;

                        const parent = startNode.getParentOrThrow();
                        
                        updatedStartPoint = $createPoint(parent.getKey(), startNode.getIndexWithinParent(), "element");

                        console.log("Updated start point", updatedStartPoint);
                    }

                    splice.removeText();

                    const selection1 = $createRangeSelection();
                    selection1.anchor = updatedStartPoint;
                    selection1.focus = $getEndPoint();

                    const extracted1 = selection1.extract();
                    const tree1 = $constructParagraphTextTree(extracted1);

                    console.log(JSON.stringify(tree, null, 2))
                    console.log(JSON.stringify(tree1, null, 2));

                    const insertPoint = $findPointByCharacterIndex(tree1, suggestion.startCharacter + charOffset);

                    if (!insertPoint) return;

                    const insert = $createRangeSelection();
                    insert.anchor = insertPoint;
                    insert.focus = insertPoint;

                    console.log(insertPoint)

                    insert.insertNodes(nodes);

                    if (updateStart) {

                        console.log("Updating start point")

                        const firstSuggestionNode = $getNodeByKey(firstSuggestionKey);
                        if (!firstSuggestionNode) return;

                        const parent = firstSuggestionNode.getParent();

                        if (!parent) return;
                        
                        updatedStartPoint = $createPoint(parent.getKey(), firstSuggestionNode.getIndexWithinParent(), "element");

                        console.log("Updated start point", updatedStartPoint);
                    }

                    charOffset += suggestion.newText.length - suggestion.endCharacter + suggestion.startCharacter + totalFakeLength;
                }
            });
        }

        dispatch(onceRendered());

    }, [suggestions]);

    return (
        <NodeEventPlugin
            nodeType={SuggestionNode} 
            eventType="click" 
            eventListener={(_, editor, nodeKey) => {

                console.log("click detected");

                const node = $getNodeByKey(nodeKey);
                if (!$isSuggestionNode(node)) return;

                const id = node.suggestionId;
                const suggestion = suggestions.find(s => s.id === id);

                if (!suggestion) return;
                
                dispatch(setAccepted({
                    id,
                    accepted: !suggestion.accepted
                }));
            }} 
        />
    );
}

export function $saveAcceptedSuggestions() {

    $selectAll();
    const allNodes = $getSelection()!.extract();

    if (allNodes.length === 1) {

        while (allNodes[allNodes.length - 1].getKey() !== $getRoot().getKey()) {

            allNodes.push(allNodes[allNodes.length - 1].getParentOrThrow());
        }
    }
    const allSuggestionNodes = allNodes.filter($isSuggestionNode);

    for (const suggestionNode of allSuggestionNodes) {

        const parent = suggestionNode.getParent();
        if (!parent) return;

        const splice = $createRangeSelection();
        const splicePoint = $createPoint(parent.getKey(), suggestionNode.getIndexWithinParent(), "element");
        splice.anchor = splicePoint;
        splice.focus = splicePoint;

        if (!suggestionNode.strikethrough) {

            splice.insertNodes(suggestionNode.getChildren().filter(node => !$isSpacerTextNode(node)));
        }

        suggestionNode.remove();
    }
}

function $createSuggestionNodes(suggestion: ClientSuggestion, appendToLastParagraph?: LexicalNode[]): [LexicalNode[], NodeKey, number] {

    const nodes: LexicalNode[] = [];
    let firstSuggestionKey: NodeKey | null = null;
    let totalFakeLength = 0;

    const addition = suggestion.originalText.length === 0;
    const removal = suggestion.newText.length === 0;

    if (suggestion.accepted && removal) {
        
        const text = suggestion.originalText;
        const lines = text.split("\n");

        console.log(suggestion, "is removal suggestion");

        const node = $createParagraphNode();
        const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted, true);

        for (let i = 0; i < lines.length - 1; i++) {

            const line = lines[i];
            let textNode: LexicalNode;

            line.length === 0 ? textNode = $createSpacerTextNode(true, 1) : textNode = $createTextNode(line);
        
            suggestionNode.append(textNode);
            totalFakeLength += textNode.getTextContentSize();

            console.log(suggestion, totalFakeLength)
        }

        const lastLine = lines[lines.length - 1];

        const textNode = $createTextNode(lastLine);
        suggestionNode.append(textNode);

        totalFakeLength += textNode.getTextContentSize();

        node.append(suggestionNode);

        if (!(appendToLastParagraph === undefined)) node.append(...appendToLastParagraph);

        if (!firstSuggestionKey) firstSuggestionKey = suggestionNode.getKey();

        nodes.push(node);

    } else if (!suggestion.accepted && addition) {
        
        const text = suggestion.newText;
        const lines = text.split("\n");

        console.log(suggestion, "is addition suggestion");

        const node = $createParagraphNode();
        const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted, true);

        for (let i = 0; i < lines.length - 1; i++) {

            const line = lines[i];
            let textNode: LexicalNode;

            line.length === 0 ? textNode = $createSpacerTextNode(true, 1) : textNode = $createTextNode(line);
        
            suggestionNode.append(textNode);
            totalFakeLength += textNode.getTextContentSize();
        }

        const lastLine = lines[lines.length - 1];

        const textNode = $createTextNode(lastLine);
        suggestionNode.append(textNode);

        totalFakeLength += textNode.getTextContentSize();

        node.append(suggestionNode);

        if (!(appendToLastParagraph === undefined)) node.append(...appendToLastParagraph);

        if (!firstSuggestionKey) firstSuggestionKey = suggestionNode.getKey();

        nodes.push(node);

    } else {
        
        console.log(suggestion, "doesnt need striketrhoguh")

        const text = suggestion.accepted ? suggestion.newText : suggestion.originalText;
        const lines = text.split("\n");

        console.log("Lines", lines);

        for (let i = 0; i < lines.length; i++) {

            const line = lines[i];

            const node = $createParagraphNode();
            const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted);

            suggestionNode.append($createTextNode(line));
            
            if (i < lines.length - 1) {
                suggestionNode.append($createSpacerTextNode(false, 1));
                totalFakeLength++;
            } else {
                if (appendToLastParagraph) {
                    suggestionNode.append(...appendToLastParagraph);
                }
            }

            node.append(suggestionNode);
            if (!(appendToLastParagraph === undefined)) node.append(...appendToLastParagraph);

            if (!firstSuggestionKey) firstSuggestionKey = suggestionNode.getKey();

            nodes.push(node);

            console.log(node, suggestionNode, suggestionNode.getChildren()[0]);
        }
    }

    if (!firstSuggestionKey) throw new Error("No suggestion key found");

    return [nodes, firstSuggestionKey, totalFakeLength];
}