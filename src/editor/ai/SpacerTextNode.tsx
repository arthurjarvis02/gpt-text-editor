import { EditorConfig, LexicalEditor, LexicalNode, SerializedTextNode, TextNode } from "lexical";

export default class SpacerTextNode extends TextNode {

    static ICON = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="lucide lucide-corner-down-left inline w-3 h-3 stroke-gray-500">
                <polyline points="9 14 4 19 9 24"/>
                <path d="M20 0v15a4 4 0 0 1-4 4H4"/>
            </svg>`,
        "text/xml"
    );

    static STRIKETHROUGH_ICON = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="lucide lucide-corner-down-left inline w-3 h-3 stroke-gray-500">
                <polyline points="9 14 4 19 9 24"/>
                <path d="M20 0v15a4 4 0 0 1-4 4H4"/>
                <path d="M0 11.2 H24"/>
            </svg>`,
        "text/xml"
    );

    strikethrough: boolean;
    fakeLength: number;
    symbol: boolean;

    constructor(striketrhough: boolean, fakeLength: number, symbol?: boolean, key?: string) {
        super(" ", key);
        this.strikethrough = striketrhough;
        this.fakeLength = fakeLength;
        this.symbol = symbol === undefined ? true : symbol;
    }

    static getType(): string {
        
        return "spacer-text";
    }

    static clone(node: SpacerTextNode): SpacerTextNode {
     
        return new SpacerTextNode(node.strikethrough, node.fakeLength, node.symbol, node.__key);
    }

    createDOM(config: EditorConfig, editor?: LexicalEditor | undefined): HTMLElement {
        
        const elem = super.createDOM(config, editor);
        const icon = this.strikethrough ? SpacerTextNode.STRIKETHROUGH_ICON : SpacerTextNode.ICON;

        this.symbol && elem.replaceChildren(icon.firstElementChild!.cloneNode(true));

        return elem;
    }

    updateDOM(prevNode: TextNode, dom: HTMLElement, config: EditorConfig): boolean {
        return true;
    }

    exportJSON(): SerializedTextNode {
            
            return {
                ...super.exportJSON(),
                type: SpacerTextNode.getType()
            };
    }

    getTextContent(): string {
        
        return "";
    }

    getTextContentSize(): number {
        return this.fakeLength;
    }
}

export function $isSpacerTextNode(node: LexicalNode): node is SpacerTextNode {
    
    return node.getType() === SpacerTextNode.getType();
}

export function $createSpacerTextNode(strikethrough?: boolean, fakeLength?: number, symbol?: boolean): SpacerTextNode {
    
    const strike = strikethrough === undefined ? false : strikethrough;
    const length = fakeLength === undefined ? 1 : fakeLength;

    return new SpacerTextNode(strike, length, symbol);
}