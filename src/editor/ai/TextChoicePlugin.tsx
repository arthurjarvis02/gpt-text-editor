"use client";

import { SerializedPointType, setAcceptedStatus, setStartPoint } from "@/lib/features/ai/aiSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createNodeSelection, $createParagraphNode, $createPoint, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $isElementNode, $isRangeSelection, $isTextNode, $parseSerializedNode, $selectAll, $setSelection, ElementNode, LexicalNode, PointType, RangeSelection, RootNode, TextNode } from "lexical";
import { useEffect } from "react";
import TextChoiceNode from "./TextChoiceNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";

export default function TextChoicePlugin() {

    const [editor] = useLexicalComposerContext();
    const edits = useAppSelector(state => state.ai.edits);
    const startPoint = useAppSelector(state => state.ai.startPoint);
    const loading = useAppSelector(state => state.ai.loading);
    const dispatch = useAppDispatch();

    useEffect(() => {

        console.log("Edits:", JSON.stringify(edits, null, 2));
        
        editor.update(() => {

            const renderedEditIds: string[] = [];

            for (const node of $getRoot().getAllTextNodes()) {

                if (node instanceof TextChoiceNode) {

                    const stateEdit = edits.find(edit => edit.id === node.editId);

                    if (!stateEdit) {

                        const newNode = $createTextNode(node.__text);
                        newNode.setFormat(node.__format);

                        const parent = node.getParentOrThrow();

                        const selection = $createRangeSelection();
                        selection.anchor = $createPoint(node.__key, 0, "text");
                        selection.focus = $createPoint(node.__key, node.getTextContentSize(), "text");

                        console.log(selection.extract());
        
                        selection.removeText();

                        console.log("Removed edit", node.editId, "from the editor")

                        continue;
                    }

                    renderedEditIds.push(node.editId);

                    console.log("Found edit", node.originalText, node.newText, "in the editor")

                    if (stateEdit.accepted !== node.accepted) {

                        console.log("Updating edit", node.editId, "to", stateEdit.accepted)

                        const newNode = new TextChoiceNode(node.__text, node.originalText, node.newText, stateEdit.accepted, node.editId, node.__format);
                        node.replace(newNode);
                    }
                }
            }

            if (renderedEditIds.length > 0 || !startPoint) return;

            console.log("Rendering new")

            const unrenderedEdits = edits.filter(edit => !renderedEditIds.includes(edit.id));

            let updatedStartPoint = startPoint;

            for (const edit of unrenderedEdits) {

                console.log("Looking for edit", edit.originalText, edit.newText);

                const selection = $getSelectionToEnd(updatedStartPoint);
                const nodes = selection.extract();

                const nodeTree = constructTextNodeTree(nodes);
                console.log("Node tree", JSON.stringify(nodeTree, null, 2));

                const startOffset = updatedStartPoint.offset;

                const start = findPointByCharacterIndex(nodeTree, edit.startCharacter);
                const end = findPointByCharacterIndex(nodeTree, edit.endCharacter);

                console.log("Start point", start, "End point", end);

                if (!start || !end) continue;

                const splice = $createRangeSelection();
                splice.anchor = start;
                splice.focus = end;
                const spliceExtracted = splice.extract();

                console.log("Text in splice:", splice.getTextContent());

                const format = spliceExtracted.length == 1 && spliceExtracted[0] instanceof TextNode ? spliceExtracted[0].__format : 0;

                const newNode = new TextChoiceNode(
                    splice.getTextContent(),
                    edit.originalText,
                    edit.newText,
                    edit.accepted,
                    edit.id,
                    format,
                );

                const startNode = $getNodeByKey(start.key);

                if (start.key == updatedStartPoint.key && $isTextNode(startNode) && startNode.getTextContentSize() == edit.endCharacter - edit.startCharacter) {

                    startNode.replace(newNode);
                    
                } else {

                    splice.insertNodes([newNode]);
                }

                console.log("Start:", start, "startPoint of selection:", updatedStartPoint);

                if (start.key == updatedStartPoint.key && start.offset == updatedStartPoint.offset && start.type == updatedStartPoint.type && start.type == "text") { // We need to update the startPoint

                    console.log("Inserting new start point")
                    updatedStartPoint = {key: newNode.__key, offset: 0, type: "text"};
                    console.log("Updated start point")
                }
            }
        });

    }, [edits]);

    const handleClick = (nodeKey: string) => {

        editor.update(() => {

            const node = $getNodeByKey(nodeKey);
            if (node instanceof TextChoiceNode) {

                console.log(node.editId, "click detected");

                //const newNode = new TextChoiceNode(node.__text, node.originalText, node.newText, !node.accepted, node.editId);
                //node.replace(newNode);

                dispatch(setAcceptedStatus({id: node.editId, accepted: !node.accepted}));
            }
        });
    };
    
    return (
        <NodeEventPlugin
            nodeType={TextChoiceNode}
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

    const paragraphNodes = orderNodes(nodes.filter(node => node instanceof ElementNode) as ElementNode[]);

    const nodesTree: TextNodeTree = [];

    if (paragraphNodes.length > 0) {

        paragraphNodes.forEach(paragraphNode => {
            nodesTree.push({
                paragraphKey: paragraphNode.__key,
                textNodes: findChildrenByParentKey(nodes, paragraphNode.__key)
            });
        });

    } else {

        nodesTree.push({
            paragraphKey: nodes[0].__parent!,
            textNodes: orderNodes(nodes as TextNode[]),
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