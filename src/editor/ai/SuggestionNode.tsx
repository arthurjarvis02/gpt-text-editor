import { ClientSuggestion } from "@/lib/types";
import { EditorConfig, ElementNode, LexicalEditor, LexicalNode, NodeKey, SerializedElementNode, SerializedLexicalNode } from "lexical";
import { boolean } from "zod";

export default class SuggestionNode extends ElementNode {

    suggestionId: string;
    accepted: boolean;
    strikethrough: boolean;
    continueLeft: boolean;
    continueRight: boolean;

    constructor(suggestionId: string, accepted: boolean, strikethrough: boolean, continueLeft: boolean, continueRight:boolean, key?: NodeKey) {

        super(key);

        this.suggestionId = suggestionId;
        this.accepted = accepted;
        this.strikethrough = strikethrough;
        this.continueLeft = continueLeft;
        this.continueRight = continueRight;
    }

    static getType(): string {

        return "suggestion";
    }

    static clone(node: SuggestionNode): SuggestionNode {

        return new SuggestionNode(node.suggestionId, node.accepted, node.strikethrough, node.continueLeft, node.continueRight, node.__key);
    }
    
    createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
        
        const container = document.createElement("span");
        container.classList.add("cursor-pointer", "py-0.5", "-my-0.5");
        container.classList.add(this.accepted ? "bg-green-100" : "bg-red-100");
        this.continueLeft || container.classList.add("rounded-s");
        this.continueRight || container.classList.add("rounded-e");
        this.strikethrough && container.classList.add("line-through");
        this.strikethrough && container.classList.add("text-gray-400");

        return container;
    }

    updateDOM(_prevNode: SuggestionNode, _dom: HTMLElement, _config: EditorConfig): boolean {

        return true;
    }

    exportJSON() {
        
        return {
            ...super.exportJSON(),
            accepted: this.accepted,
            type: SuggestionNode.getType()
        };
    }

    setAccepted(accepted: boolean): void {
        const writable = this.getWritable();
        writable.accepted = accepted;
    }

    isInline(): boolean {
        return true;
    }
    
    canInsertTextAfter(): boolean {
        return false;
    }

    canInsertTextBefore(): boolean {
        return false;
    }
}

export function $isSuggestionNode(node: LexicalNode | null | undefined): node is SuggestionNode {

    return node instanceof SuggestionNode;
}

export function $createSuggestionNode(suggestionId: string, accepted: boolean, strikethrough?: boolean, continueLeft?: boolean, continueRight?: boolean): SuggestionNode {

    const strike = strikethrough === undefined ? false : strikethrough;

    return new SuggestionNode(suggestionId, accepted, strike, continueLeft || false, continueRight || false);
}