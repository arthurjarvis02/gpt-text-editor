import { EditorConfig, LexicalEditor, NodeKey, SerializedTextNode, TextFormatType, TextNode } from "lexical";

export default class TextChoiceNode extends TextNode {

    editId: string;
    originalText: string;
    newText: string;
    accepted: boolean;
    addition: boolean;
    removal: boolean;

    constructor(text: string, originalText: string, newText: string, accepted: boolean, editId: string, format: TextFormatType | number, key?: NodeKey) {

        super(text, key);
        this.editId = editId;
        this.originalText = originalText;
        this.newText = newText;
        this.accepted = accepted;

        this.addition = originalText === "";
        this.removal = newText === "";

        super.setFormat(format);

        console.log("Text choice node", this.originalText, this.newText)
    }

    static getType(): string {
            
        return "text-choice";
    }

    static clone(node: TextChoiceNode): TextChoiceNode {
     
        return new TextChoiceNode(node.__text, node.originalText, node.newText, node.accepted, node.editId, node.__format, node.__key);
    }

    createDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
        
        const container = document.createElement("span");
        container.classList.add("cursor-pointer", "rounded", "py-0.5", "-my-0.5");
        this.accepted ? container.classList.add("bg-green-100") : container.classList.add("bg-red-100");
        super.hasFormat("bold") && container.classList.add("font-bold");
        super.hasFormat("italic") && container.classList.add("italic");
        super.hasFormat("underline") && container.classList.add("underline");

        console.log(this.addition, this.removal, this.originalText, this.newText);

        if (this.addition) {

            const strike = document.createElement("span");
            !this.accepted && strike.classList.add("line-through");
            strike.textContent = this.newText

            container.appendChild(strike);

        } else if (this.removal) {

            const strike = document.createElement("span");
            this.accepted && strike.classList.add("line-through");
            strike.textContent = this.originalText

            container.appendChild(strike);

        } else {

            container.innerText = this.accepted ? this.newText : this.originalText;
        }

        return container;
    }

    canInsertTextBefore(): boolean {
            
        return false;
    }

    canInsertTextAfter(): boolean {
            
        return false;
    }

    exportJSON(): SerializedTextNode {
                
            return {
                ...super.exportJSON(),
                type: TextChoiceNode.getType()
            };
    }
}