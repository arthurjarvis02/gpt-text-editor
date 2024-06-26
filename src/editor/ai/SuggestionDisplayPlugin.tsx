"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { $deserializePoint, exportParagraphTextTree, ClientSuggestion, SerializedParagraphTextTree, ParagraphTextTree, serializePoint } from "@/lib/types";
import { $constructParagraphTextTree, $findPointByCharacterIndex, $getEndPoint } from "@/lib/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createPoint, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isParagraphNode, $isTextNode, $selectAll, $setSelection, LexicalNode, NodeKey, ParagraphNode, RangeSelection, TextFormatType, TextNode } from "lexical";
import { useEffect } from "react";
import SuggestionNode, { $createSuggestionNode, $isSuggestionNode } from "./SuggestionNode";
import { onceRendered, setAccepted, setFormats, setOriginalContent } from "@/lib/features/ai/aiSlice";
import { deserialize } from "v8";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import { $createSpacerTextNode, $isSpacerTextNode } from "./SpacerTextNode";
import { Dialog } from "@/components/ui/dialog";

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

                    console.log(JSON.stringify(tree, null, 2));

                    let start = $findPointByCharacterIndex(tree, suggestion.startCharacter + charOffset, true);
                    let end = $findPointByCharacterIndex(tree, suggestion.endCharacter + charOffset);

                    if (!start || !end) return;

                    const splice = $createRangeSelection();
                    splice.anchor = start;
                    splice.focus = end;

                    console.log(serializePoint(start), serializePoint(end));

                    const startNode = $getNodeByKey(start.key);
                    const endNode = $getNodeByKey(end.key);

                    console.log(startNode, endNode);

                    if (!startNode || !endNode) {
                        
                        charOffset += -suggestion.endCharacter + suggestion.startCharacter

                        continue;
                    }

                    console.log("Original text:", splice.getTextContent());

                    const originalContent = $extractSelection(splice);
                    dispatch(setOriginalContent({id: suggestion.id, originalContent}));
                    console.log("Original content:", originalContent);
                    console.log("Nodes:", splice.getNodes());


                    const textNodesNonEmpty =  originalContent.flat().filter(node => node.text.length !== 0)
                    const formats: TextFormatType[] = [];

                    if (textNodesNonEmpty.length > 0){
                        for (const format of ["bold", "italic", "underline"] as TextFormatType[]) {

                            // splice.getNodes()
                            //     .filter($isTextNode)
                            //     .filter(node => (node as TextNode).getTextContentSize() > 0)
                            //     .every(node => node.hasFormat(format)) && formats.push(format);
                        
                            textNodesNonEmpty.every(node => TextNode.importJSON(node).hasFormat(format)) 
                            && formats.push(format);
                        }
                    }

                    console.log(splice.getNodes(), formats);

                    dispatch(setFormats({id: suggestion.id, formats}));

                    const [nodes, firstSuggestionKey, totalFakeLength] = $createSuggestionNodes({...suggestion, originalContent, formats});

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

                const selectNone = $createRangeSelection();
                selectNone.anchor = updatedStartPoint;
                selectNone.focus = updatedStartPoint;
                $setSelection(selectNone);
            });
        }

        dispatch(onceRendered());

    }, [suggestions]);
    
    return (
        <>
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
        </>
    );
}

function $extractSelection(selection: RangeSelection): SerializedParagraphTextTree {

    const startEndPoints = selection.getStartEndPoints();

    if (!startEndPoints) throw new Error("No start end points");

    const startPoint = startEndPoints[selection.isBackward() ? 1 : 0];
    const endPoint = startEndPoints[selection.isBackward() ? 0 : 1];

    const allNodes = selection.getNodes();
    const allTree = exportParagraphTextTree($constructParagraphTextTree(allNodes));

    const startNode = $getNodeByKey(startPoint.key);

    if (!startNode) throw new Error("Start node not found");

    if (startPoint.type == "text" && startPoint.offset !== 0 && $isTextNode(startNode)) {

        console.log("Start point is text not at beginning of text node");

        allTree[0][0] = {
            ...startNode.exportJSON(),
            text: allTree[0][0].text.slice(startPoint.offset)
        }
    }

    const endNode = $getNodeByKey(endPoint.key);

    if (!endNode) throw new Error("End node not found");

    if (endPoint.type == "text" && $isTextNode(endNode)) {

        console.log("End point is text");

        if (endPoint.offset !== endNode.getTextContentSize()) {

            console.log("End point is not at end of text node");

            let endIndex = endPoint.offset;
            if (startNode.getKey() === endNode.getKey()) endIndex -= startPoint.offset;

            allTree[allTree.length - 1][allTree[allTree.length - 1].length - 1] = {
                ...endNode.exportJSON(),
                text: allTree[allTree.length - 1][allTree[allTree.length - 1].length - 1].text.slice(0, endIndex)
            }
        }
    }

    return allTree;
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

        console.log("Accepting/rejecting", suggestionNode.accepted, suggestionNode.suggestionId);

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

    const addition = suggestion.startCharacter === suggestion.endCharacter;
    const removal = suggestion.newText.length === 0;
    
    const setFormats = suggestion.formats || [];

    console.log("Set formats", setFormats);

    if (suggestion.accepted && removal) {

        console.log("Accepted removal")

        const node = $createParagraphNode();
        const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted, true);

        const crossNode = $createSpacerTextNode(false, 0, false);

        suggestionNode.append(crossNode);

        node.append(suggestionNode);

        if (!(appendToLastParagraph === undefined)) node.append(...appendToLastParagraph);

        firstSuggestionKey = suggestionNode.getKey()!;

        nodes.push(node);

        return [nodes, firstSuggestionKey, totalFakeLength];

    } else if (!suggestion.accepted && addition) {

        console.log("Rejected addition")

        const node = $createParagraphNode();
        const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted, true);

        const crossNode = $createSpacerTextNode(true, 0, false);

        suggestionNode.append(crossNode);

        node.append(suggestionNode);

        if (!(appendToLastParagraph === undefined)) node.append(...appendToLastParagraph);

        firstSuggestionKey = suggestionNode.getKey()!;

        nodes.push(node);

    } else {

        if (!suggestion.accepted && suggestion.originalContent !== undefined) {

            console.log("Has original contente saved")

            console.log(suggestion.originalContent);

            for (let i = 0; i < suggestion.originalContent.length; i++) {

                const node = $createParagraphNode();
                const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted, false, i !== 0, (i !== suggestion.originalContent.length - 1 - (suggestion.originalContent[suggestion.originalContent.length - 1].length === 0 || suggestion.originalContent[suggestion.originalContent.length - 1][0].text.length === 0 ? 1 : 0)));

                suggestionNode.append(...suggestion.originalContent[i].map(jsonTextNode => TextNode.importJSON(jsonTextNode)));
            
                node.append(suggestionNode);

                if (i < suggestion.originalContent.length - 1) {
                    suggestionNode.append($createSpacerTextNode(false, 1));
                    totalFakeLength++;
                } else {
                    if (appendToLastParagraph) {
                        node.append(...appendToLastParagraph);
                    }

                    //if (suggestion.originalContent[i].length === 0) suggestionNode.append($createSpacerTextNode(false, 1, false, true));
                }

                if (!firstSuggestionKey) firstSuggestionKey = suggestionNode.getKey();

                nodes.push(node);
            }

            if (!firstSuggestionKey) throw new Error("No suggestion key found");
            console.log(nodes);
            return [nodes, firstSuggestionKey, totalFakeLength];
        }
        
        console.log(suggestion, "doesnt need striketrhoguh")

        const text = suggestion.newText;
        const lines = text.split("\n");

        console.log("Lines", lines);

        for (let i = 0; i < lines.length; i++) {

            const line = lines[i];

            const node = $createParagraphNode();
            const suggestionNode = $createSuggestionNode(suggestion.id, suggestion.accepted, false, i !== 0, (i !== lines.length - 1 - (lines[lines.length - 1].length === 0 || lines[lines.length - 1].length === 0 ? 1 : 0)));

            const textNode = $createTextNode(line);
            setFormats.forEach(format => textNode.toggleFormat(format));

            suggestionNode.append(textNode);
            
            if (i < lines.length - 1) {
                suggestionNode.append($createSpacerTextNode(false, 1));
                totalFakeLength++;
            } else {
                //if (line.length === 0) suggestionNode.append($createSpacerTextNode(false, 1, false, true));
                if (appendToLastParagraph) {
                    suggestionNode.append(...appendToLastParagraph);
                }
            }

            node.append(suggestionNode);
            if (!(appendToLastParagraph === undefined)) node.append(...appendToLastParagraph);

            if (!firstSuggestionKey) firstSuggestionKey = suggestionNode.getKey();

            nodes.push(node);
        }
    }

    if (!firstSuggestionKey) throw new Error("No suggestion key found");

    return [nodes, firstSuggestionKey, totalFakeLength];
}