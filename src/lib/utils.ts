import { type ClassValue, clsx } from "clsx"
import { $createParagraphNode, $createPoint, $createRangeSelection, $getNodeByKey, $getRoot, $isElementNode, $isParagraphNode, $isTextNode, LexicalNode, ParagraphNode, PointType, RangeSelection, TextNode } from "lexical"
import { twMerge } from "tailwind-merge"
import { ParagraphTextTree, SerializedParagraphTextTree } from "./types"
import { $isSuggestionNode } from "@/editor/ai/SuggestionNode"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function $findPointByCharacterIndex(tree: ParagraphTextTree, index: number, skipToNext?: boolean) {

    let charIndex = 0;

    let point: PointType | null = null;

    for (let p = 0; p < tree.length; p++) {

        const para = tree[p];
        const paraChildren = para.children;

        if (paraChildren.length == 0) {

            if (charIndex == index) {
                
                point = $createPoint(para.key, 0, "element");
            }

        } else {

            for (let n = 0; n < paraChildren.length; n++) {

                const text = paraChildren[n]

                const length = text.getTextContentSize();

                if (charIndex + length == index && (!skipToNext || n == paraChildren.length - 1)) {

                    console.log("At end, found it")
                    point = $createPoint(text.__key, length, "text");
                    return point;

                }

                if (charIndex <= index && charIndex + length > index) {
                    point = $createPoint(text.__key, index - charIndex, "text")
                    return point;
                }

                charIndex += length;

            }
        }

        charIndex ++;
    }

    return point;
}

export function $constructParagraphTextTree(nodes: LexicalNode[]): ParagraphTextTree {

    const orderedParagraphs = $nodesToSorted(nodes.filter($isParagraphNode))

    const tree: ParagraphTextTree = [];

    if (orderedParagraphs.length === 0) {
        
        orderedParagraphs.push($getNodeByKey(getCommonAncestorMultiple(nodes).getKey())!)
    }

    for (const paragraph of orderedParagraphs) {

        const children = $nodesToSorted(getChildrenByParentKey(nodes, paragraph.getKey()));
        const textChildren: TextNode[] = [];

        for (const child of children) {

            if ($isSuggestionNode(child)) {
                
                textChildren.push(...$nodesToSorted(getChildrenByParentKey(nodes, child.getKey())) as TextNode[]);

            } else {

                textChildren.push(child as TextNode);
            }
        }

        tree.push({
            key: paragraph.getKey(),
            children: textChildren
        });
    }

    return tree;
}

function getCommonAncestorMultiple(nodes: LexicalNode[]) {

    let commonAncestor = nodes[0].getParent()!;
    
    for (let i = 1; i < nodes.length; i++) {
        commonAncestor = commonAncestor.getCommonAncestor(nodes[i].getParent()!)!;
    }

    return commonAncestor;
}

function getChildrenByParentKey(nodes: LexicalNode[], parentKey: string) {
    return nodes.filter(node => node.getParent()?.getKey() === parentKey);
}

function $nodesToSorted(nodes: LexicalNode[]) {
    return nodes.toSorted((a, b) => a.getIndexWithinParent() - b.getIndexWithinParent());
}

export function $getEndPoint(): PointType {

    let lastNode = $getRoot().getLastDescendant();
    let lastType: "element" | "text" = "element";
    let lastOffset = 0;

    if ($isTextNode(lastNode)) {
        lastType = 'text';
        lastOffset = lastNode.getTextContentSize();
    } else if (!$isElementNode(lastNode) && lastNode !== null) {
        lastNode = lastNode.getParentOrThrow();
    }

    if (!lastNode) throw new Error("No last node found");

    return $createPoint(lastNode.getKey(), lastOffset, lastType);
}
