"use client";

import { ClientSuggestion, SerializedPointType, setAccepted, setStartPoint } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createNodeSelection, $createParagraphNode, $createPoint, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isElementNode, $isRangeSelection, $isTextNode, $parseSerializedNode, $selectAll, $setSelection, ElementNode, LexicalNode, ParagraphNode, PointType, RangeSelection, RootNode, TextFormatType, TextNode } from "lexical";
import { useEffect } from "react";
import TextChoiceNode from "./TextChoiceNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import SuggestionNode, { $createSuggestionNode, $isSuggestionNode } from "./SuggestionNode";
import { Suggestion } from "@/lib/api/editText";

export default function TextChoicePlugin() {

    const [editor] = useLexicalComposerContext();
    const suggestions = useAppSelector(state => state.ai.suggestions);
    const loading = useAppSelector(state => state.ai.loading);
    const startPoint = useAppSelector(state => state.ai.startPoint);
    const dispatch = useAppDispatch();

    useEffect(() => {

        editor.update(() => {

            const selection = $getSelectionToEnd(startPoint || {key: $getRoot().getKey(), offset: 0, type: "element"});
            const nodes = selection.extract();

            let rendered = false;

            for (const node of nodes) {

                if ($isSuggestionNode(node)) {

                    const suggestion = suggestions.find(suggestion => suggestion.id === node.suggestionId);
                    const children = node.getChildren();

                    const spliceFormats: TextFormatType[] = [];

                    for (const format of ["bold", "italic", "underline"] as TextFormatType[]) {

                        (children.filter(node => $isTextNode(node)) as TextNode[]).every(node => node.hasFormat(format)) && spliceFormats.push(format);
                    }

                    if (!suggestion) {

                        node.remove();
                        
                        continue;
                    }

                    node.setAccepted(suggestion.accepted);

                    calculateStrikethrough(suggestion) && spliceFormats.push("strikethrough");

                    children.forEach(child => child.remove());

                    const newTextNode = $createTextNode(calculateText(suggestion));
                    spliceFormats.forEach(format => newTextNode.toggleFormat(format));

                    node.append(newTextNode);
                    rendered = true;
                }
            }

            if (rendered || !startPoint) return;

            console.log(JSON.stringify(suggestions, null, 2));
            
            let updatedStartPoint = startPoint;
            let offset = 0;

            for (const suggestion of suggestions) {

                console.log("Looking for edit", suggestion.newText);

                const selection = $getSelectionToEnd(updatedStartPoint);
                const nodes = selection.extract();

                console.log(nodes);

                const nodeTree = constructTextNodeTree(nodes);
                console.log("Node tree", JSON.stringify(nodeTree, null, 2));

                const startChar = suggestion.startCharacter - offset;
                const endChar = suggestion.endCharacter - offset;

                const start = findPointByCharacterIndex(nodeTree, startChar);
                const end = findPointByCharacterIndex(nodeTree, endChar);

                console.log("Start point", start, "End point", end);

                if (!start || !end) continue;

                const splice = $createRangeSelection();
                splice.anchor = start;
                splice.focus = end;

                const spliceExtracted = splice.extract();
                console.log("Within two points:", spliceExtracted)
                const spliceFormats: TextFormatType[] = [];

                for (const format of ["bold", "italic", "underline"] as TextFormatType[]) {

                    (spliceExtracted.filter(node => $isTextNode(node)) as TextNode[]).every(node => node.hasFormat(format)) && spliceFormats.push(format);
                }
                
                calculateStrikethrough(suggestion) && spliceFormats.push("strikethrough");

                console.log("has formats:", spliceFormats)

                let suggestionNode: SuggestionNode | null = null;
                let prevParent: ElementNode | null = null;

                if (start.is(end) && spliceExtracted.length === 1 && $isTextNode(spliceExtracted[0])) {

                    const [before, after] = spliceExtracted[0].splitText(splice.anchor.offset);

                    suggestionNode = $createSuggestionNode(suggestion);
                    before.insertAfter(suggestionNode);

                } else {

                    for (const node of spliceExtracted) {

                        const parent = node.getParent();
                
                        if (parent === suggestionNode || parent === null || ($isElementNode(node) && !node.isInline())) continue;
                
                        if (!parent.is(prevParent)) {
                            
                            prevParent = parent;
                            suggestionNode = $createSuggestionNode(suggestion);
                    
                            if (parent instanceof SuggestionNode) {

                                if (node.getPreviousSibling() === null) {

                                    parent.insertBefore(suggestionNode);
        
                                } else {

                                    parent.insertAfter(suggestionNode);
                                }

                            } else {

                                node.insertBefore(suggestionNode);
                            }
                        }
                
                        if (node instanceof SuggestionNode) {

                            if (node.is(suggestionNode)) continue;

                            if (suggestionNode !== null) {

                                const children = node.getChildren();
                    
                                for (let i = 0; i < children.length; i++) {

                                    suggestionNode.append(children[i]);
                                }
                            }
                    
                            node.remove();

                        } else if (suggestionNode !== null) {

                            suggestionNode.append(node);
                        }
                    }
                }

                if (!suggestionNode) return;

                suggestionNode.getChildren().forEach(child => child.remove());
                const newTextNode = $createTextNode(calculateText(suggestion));

                spliceFormats.forEach(format => newTextNode.toggleFormat(format))
                suggestionNode.append(newTextNode);

                console.log("updating start point")

                updatedStartPoint = $createPoint(suggestionNode.getParentOrThrow().getKey(), suggestionNode.getIndexWithinParent() + 1, "element");
                offset = suggestion.endCharacter;
                console.log("Offset", offset, "Updated start point", updatedStartPoint)

                console.log(splice.extract());
            }
        })

    }, [suggestions]);

    const handleClick = (nodeKey: string) => {

        editor.update(() => {

            const node = $getNodeByKey(nodeKey);
            
            if (node instanceof SuggestionNode) {

                console.log(node.suggestionId, "click detected");

                dispatch(setAccepted({id: node.suggestionId, accepted: !node.accepted}));
            }
        });
    };
    
    return (
        <NodeEventPlugin
            nodeType={SuggestionNode}
            eventType="click"
            eventListener={(_, editor, nodeKey) => handleClick(nodeKey)}
        />
    );
}

const calculateText = ({accepted, addition, removal, newText, originalText}: ClientSuggestion) => accepted ? (removal ? originalText : newText): (addition ? newText : originalText);
const calculateStrikethrough = ({accepted, addition, removal}: ClientSuggestion) => (accepted && removal) || (!accepted && addition);

export function $saveChanges(suggestions: ClientSuggestion[]) {

    const selection = $getSelectionToEnd({key: $getRoot().getKey(), offset: 0, type: "element"});
    const nodes = selection.extract();

    for (const node of nodes) {

        if ($isSuggestionNode(node)) {

            const suggestion = suggestions.find(suggestion => suggestion.id === node.suggestionId);

            if (!suggestion) {

                node.remove();
                continue;
            }

            const children = node.getChildren();

            const formats: TextFormatType[] = [];

            for (const format of ["bold", "italic", "underline"] as TextFormatType[]) {

                (children.filter(node => $isTextNode(node)) as TextNode[]).every(node => node.hasFormat(format)) && formats.push(format);
            }

            children.forEach(child => child.remove());

            const newTextNode = $createTextNode(suggestion.accepted ? suggestion.newText : suggestion.originalText);
            formats.forEach(format => newTextNode.toggleFormat(format));

            node.replace(newTextNode);
        }

    }
}

function $getSelectionToEnd(startPoint: SerializedPointType): RangeSelection {

    const selection = $createRangeSelection();

    selection.anchor = $createPoint(startPoint.key, startPoint.offset, startPoint.type);

    let lastNode = $getRoot().getLastDescendant();
    let lastType: "element" | "text" = "element";
    let lastOffset = 0;

    if ($isTextNode(lastNode)) {
        lastType = 'text';
        lastOffset = lastNode.getTextContentSize();
    } else if (!$isElementNode(lastNode) && lastNode !== null) {
        lastNode = lastNode.getParentOrThrow();
    }

    if (lastNode) {

        selection.focus = $createPoint(lastNode.getKey(), lastOffset, lastType);
    }

    return selection;
}

function findPointByCharacterIndex(nodes: TextNodeTree, index: number): PointType | null {

    let charIndex = 0;

    let point: PointType | null = null;

    for (let p = 0; p < nodes.length; p++) {

        console.log("Checking paragraph", nodes[p])

        const para = nodes[p];
        const paraChildren = para.textNodes;

        if (paraChildren.length == 0) {
            // Contains no text nodes (new line only)
            console.log("Empty paragraph")
            if (charIndex == index) {
                point = $createPoint(para.paragraphKey, 0, "element");
            }

        } else {
            // Contains text nodes
            console.log("Contains", paraChildren.length, "text nodes")

            for (let n = 0; n < paraChildren.length; n++) {

                console.log("Checking text node", paraChildren[n].__text)

                const text = paraChildren[n]

                const length = text.__text.length;

                if (charIndex <= index && charIndex + length >= index) {
                    point = $createPoint(text.__key, index - charIndex, "text")
                    return point;
                }

                charIndex += length;

                console.log("text", text.__text, "ending with char index", charIndex)
            }
        }
        charIndex ++;

        console.log("Paragraph", para.paragraphKey, "ending with char index", charIndex)
    }

    return point;
}

type TextNodeTree = {
    paragraphKey: string,
    textNodes: TextNode[]
}[];

function constructTextNodeTree(nodes: LexicalNode[]): TextNodeTree {

    const paragraphNodes = orderNodes(nodes.filter(node => node instanceof ParagraphNode) as ParagraphNode[]);

    const nodesTree: TextNodeTree = [];

    if (paragraphNodes.length > 0) {

        paragraphNodes.forEach(paragraphNode => {

            const children = orderNodes(findChildrenByParentKey(nodes, paragraphNode.__key));
            const textNodes: TextNode[] = [];

            children.forEach(child => {
                    
                    if ($isSuggestionNode(child)) {
                        
                        const suggestionNode = child as SuggestionNode;
                        textNodes.push(...orderNodes<TextNode>(suggestionNode.getChildren()));

                    } else if ($isTextNode(child)) {

                        textNodes.push(child as TextNode);
                    }
            });

            nodesTree.push({
                paragraphKey: paragraphNode.__key,
                textNodes
            });
        });

    } else {

        console.log("only 1")

        nodesTree.push({
            paragraphKey: nodes[0].__parent!,
            textNodes: orderNodes(nodes).filter(node => node instanceof TextNode) as TextNode[],
        });
    }

    return nodesTree;
}

function findFirstNode<T extends LexicalNode>(nodes: T[]): T {

    let firstNode = nodes[0];

    while (firstNode && firstNode.__prev) {
        const prev = getNodeByKey(nodes, firstNode.__prev) as T;
        if (!prev) break;
        firstNode = prev;
    }

    return firstNode;
}

function findChildrenByParentKey(nodes: LexicalNode[], key: string): TextNode[] {

    const children: TextNode[] = [];

    for (const node of nodes) {
        if (node.__parent === key) {
            children.push(node as TextNode);
        }
    }

    return orderNodes(children);
}

function orderNodes<T extends LexicalNode>(nodes: T[]): T[] {

    const ordered: T[] = [];
    const first = findFirstNode(nodes);

    if (first) {

        ordered.push(first);
        let nextKey = first.__next;

        while (nextKey) {
            const next = getNodeByKey(nodes, nextKey) as T;
            if (!next) break;
            ordered.push(next);
            nextKey = next.__next;
        }
    }

    return ordered;
}

function getNodeByKey(nodes: LexicalNode[], key: string): LexicalNode | null {

    for (const node of nodes) {
        if (node.__key === key) {
            return node;
        }
    }
    return null;
}