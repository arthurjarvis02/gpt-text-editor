import { ClientSuggestion } from "@/lib/types";
import { EditorConfig, ElementNode, LexicalEditor, LexicalNode, NodeKey, SerializedElementNode, SerializedLexicalNode } from "lexical";

export default class SuggestionNode extends ElementNode {

    suggestionId: string;
    accepted: boolean;
    strikethrough: boolean;

    constructor(suggestionId: string, accepted: boolean, strikethrough: boolean, key?: NodeKey) {

        super(key);

        this.suggestionId = suggestionId;
        this.accepted = accepted;
        this.strikethrough = strikethrough;
    }

    static getType(): string {

        return "suggestion";
    }

    static clone(node: SuggestionNode): SuggestionNode {

        return new SuggestionNode(node.suggestionId, node.accepted, node.strikethrough, node.__key);
    }
    
    createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
        
        const container = document.createElement("span");
        container.classList.add("cursor-pointer", "rounded", "py-0.5", "-my-0.5");
        container.classList.add(this.accepted ? "bg-green-100" : "bg-red-100");
        this.strikethrough && container.classList.add("line-through");
        this.strikethrough && container.classList.add("text-gray-400");

        return container;
    }

    updateDOM(_prevNode: SuggestionNode, _dom: HTMLElement, _config: EditorConfig): boolean {
     
        console.log("Updating dom")

        if (_prevNode.accepted !== this.accepted) {

            _dom.classList.remove(_prevNode.accepted ? "bg-green-100" : "bg-red-100");
            _dom.classList.add(this.accepted ? "bg-green-100" : "bg-red-100");

            return false;
        }

        if (_prevNode.strikethrough !== this.strikethrough) {
            
            _dom.classList.toggle("text-gray-400");
            _dom.classList.toggle("line-through");

            return false;
        }

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

export function $createSuggestionNode(suggestionId: string, accepted: boolean, strikethrough?: boolean): SuggestionNode {

    const strike = strikethrough === undefined ? false : strikethrough;

    return new SuggestionNode(suggestionId, accepted, strike);
}