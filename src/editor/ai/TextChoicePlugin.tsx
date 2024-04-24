"use client";

import { SerializedPointType, setAccepted, setStartPoint } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createNodeSelection, $createParagraphNode, $createPoint, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isElementNode, $isRangeSelection, $isTextNode, $parseSerializedNode, $selectAll, $setSelection, ElementNode, LexicalNode, ParagraphNode, PointType, RangeSelection, RootNode, TextNode } from "lexical";
import { useEffect } from "react";
import TextChoiceNode from "./TextChoiceNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import SuggestionNode, { $createSuggestionNode } from "./SuggestionNode";

export default function TextChoicePlugin() {

    const [editor] = useLexicalComposerContext();
    const suggestions = useAppSelector(state => state.ai.suggestions);
    const startPoint = useAppSelector(state => state.ai.startPoint);
    const dispatch = useAppDispatch();

    useEffect(() => {

        editor.update(() => {

            console.log(JSON.stringify(suggestions, null, 2))

            if (!startPoint) return;
            
            let updatedStartPoint = startPoint;
            let offset = 0;

            for (const suggestion of suggestions) {

                console.log("Looking for edit", suggestion.newText);

                const selection = $getSelectionToEnd(updatedStartPoint);
                const nodes = selection.extract();

                console.log(nodes);

                const nodeTree = constructTextNodeTree(nodes);
                console.log("Node tree", JSON.stringify(nodeTree, null, 2));

                const start = findPointByCharacterIndex(nodeTree, suggestion.startCharacter - offset);
                const end = findPointByCharacterIndex(nodeTree, suggestion.endCharacter - offset);

                console.log("Start point", start, "End point", end);

                if (!start || !end) continue;

                const splice = $createRangeSelection();
                splice.anchor = start;
                splice.focus = end;

                const spliceExtracted = splice.extract();
                console.log("Within two points:", spliceExtracted)

                let suggestionNode: SuggestionNode | null = null;
                let prevParent: ElementNode | null = null;

                for (const node of spliceExtracted) {

                    const parent = node.getParent();
              
                    if (parent === suggestionNode || parent === null || ($isElementNode(node) && !node.isInline())) return;
              
                    if (parent instanceof SuggestionNode) {

                        console.log("found node", suggestion.id, parent.suggestionId)
                        suggestionNode = parent;
                        parent.setAccepted(suggestion.accepted);
                        console.log("case 1")
                    } else if (!parent.is(prevParent)) {
                        
                        prevParent = parent;
                        suggestionNode = $createSuggestionNode(suggestion);
                
                        if (parent instanceof SuggestionNode) {

                            if (node.getPreviousSibling() === null) {

                                parent.insertBefore(suggestionNode);
                                console.log("case 2")
    
                            } else {

                                parent.insertAfter(suggestionNode);
                                console.log("case 3")
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

                if (!suggestionNode) return;

                console.log("updating start point")

                updatedStartPoint = $createPoint(suggestionNode.getParentOrThrow().getKey(), suggestionNode.getIndexWithinParent() + 1, "element");
                offset = suggestion.endCharacter;

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

        const para = nodes[p];
        const paraChildren = para.textNodes;

        if (paraChildren.length == 0) {
            // Contains no text nodes (new line only)


            if (charIndex == index) {
                point = $createPoint(para.paragraphKey, 0, "element");
            }

        } else {
            // Contains text nodes

            for (let n = 0; n < paraChildren.length; n++) {

                const text = paraChildren[n]

                const length = text.__text.length;

                if (charIndex <= index && charIndex + length >= index) {
                    point = $createPoint(text.__key, index - charIndex, "text")
                    break;
                }

                charIndex += length;
            }
        }
        charIndex ++;
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

            const selection = $createRangeSelection();

            nodesTree.push({
                paragraphKey: paragraphNode.__key,
                textNodes: orderNodes(paragraphNode.getAllTextNodes())
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