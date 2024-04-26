import { $createParagraphNode, $createPoint, NodeKey, PointType, SerializedTextNode, TextNode } from "lexical";
import { $constructParagraphTextTree } from "./utils";

export type Suggestion = {
    startCharacter: number;
    endCharacter: number;
    originalText: string;
    newText: string;
}

export type ClientSuggestion = Suggestion & {
    id: string;
    accepted: boolean;
    originalContents?: SerializedParagraphTextTree
}

export type SerializedPointType = {
    key: string;
    offset: number;
    type: "text" | "element";
}

export function serializePoint(point: PointType): SerializedPointType {

    return {
        key: point.key,
        offset: point.offset,
        type: point.type
    };
}

export function $deserializePoint(point: SerializedPointType): PointType {

    return $createPoint(point.key, point.offset, point.type);
}

export type ParagraphTextTree = {
    key: NodeKey;
    children: TextNode[];
}[];

export type SerializedParagraphTextTree = SerializedTextNode[][];



export function exportParagraphTextTree(tree: ParagraphTextTree): SerializedParagraphTextTree {

    return tree.map(paragraph => paragraph.children.map(child => child.exportJSON()));
}

export function $importParagraphTextTree(serialized: SerializedParagraphTextTree): ParagraphTextTree {

    const nodes = serialized.map(paragraph => {

        const paragraphNode = $createParagraphNode();

        paragraph.forEach(child => paragraphNode.append(TextNode.importJSON(child)));

        return paragraphNode;
    });

    return $constructParagraphTextTree(nodes);
}