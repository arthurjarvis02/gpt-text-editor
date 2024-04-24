import { Suggestion } from "@/lib/api/editText";
import { ClientSuggestion } from "@/lib/features/ai/aiSlice";
import { EditorConfig, ElementNode, LexicalEditor, LexicalNode, NodeKey, SerializedElementNode, SerializedLexicalNode } from "lexical";

export default class SuggestionNode extends ElementNode {

    suggestionId: string;
    accepted: boolean;

    constructor(suggestionId: string, accepted: boolean, key?: NodeKey) {

        super(key);

        this.suggestionId = suggestionId;
        this.accepted = accepted;
    }

    static getType(): string {

        return "suggestion";
    }

    static clone(node: SuggestionNode): SuggestionNode {

        return new SuggestionNode(node.suggestionId, node.accepted, node.__key);
    }
    
    createDOM(_config: EditorConfig, _editor: LexicalEditor): HTMLElement {
        
        const container = document.createElement("span");
        container.classList.add("cursor-pointer", "rounded", "py-0.5", "-my-0.5");
        container.classList.add(this.accepted ? "bg-green-100" : "bg-red-100");

        return container;
    }

    updateDOM(_prevNode: SuggestionNode, _dom: HTMLElement, _config: EditorConfig): boolean {
     
        return false;
    }

    exportJSON() {
        
        return {
            ...super.exportJSON(),
            accepted: this.accepted
        };
    }

    setAccepted(accepted: boolean): void {
        const writable = this.getWritable();
        writable.accepted = accepted;
      }
}

export function $isSuggestionNode(node: LexicalNode | null | undefined): node is SuggestionNode {

    return node instanceof SuggestionNode;
}

export function $createSuggestionNode(suggestion: ClientSuggestion): SuggestionNode {

    return new SuggestionNode(suggestion.id, suggestion.accepted);
}