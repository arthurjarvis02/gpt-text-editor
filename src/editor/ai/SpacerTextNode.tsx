import { EditorConfig, LexicalEditor, LexicalNode, SerializedTextNode, TextNode } from "lexical";

export default class SpacerTextNode extends TextNode {

    static ICON = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="lucide lucide-corner-down-left inline w-3 h-3 stroke-gray-400">
                <polyline points="9 14 4 19 9 24"/>
                <path d="M20 0v15a4 4 0 0 1-4 4H4"/>
            </svg>`,
        "text/xml"
    );

    static REJECTED_ADDITION_ICON = new DOMParser().parseFromString(
        `<svg 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="lucide lucide-pencil inline w-3 h-3 stroke-gray-400"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
            <path d="M0 0 L 24 24"/>
        </svg>`,
        "text/xml"
    )

    static ACCEPTED_REMOVAL_ICON = new DOMParser().parseFromString(
        `<svg 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            class="lucide lucide-pencil inline w-3 h-3 stroke-gray-400"
        >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
            <path d="M0 0 L 24 24"/>
        </svg>`,
        "text/xml"
    )

    static SPARKLES_ICON = new DOMParser().parseFromString(
        ``,
        "text/xml"
    )

    strikethrough: boolean;
    fakeLength: number;
    symbol: boolean;
    blank: boolean;

    constructor(striketrhough: boolean, fakeLength: number, symbol?: boolean, blank?: boolean, key?: string) {
        super(" ", key);
        this.strikethrough = striketrhough;
        this.fakeLength = fakeLength;
        this.symbol = symbol === undefined ? true : symbol;
        this.blank = blank!;
    }

    static getType(): string {
        
        return "spacer-text";
    }

    static clone(node: SpacerTextNode): SpacerTextNode {
     
        return new SpacerTextNode(node.strikethrough, node.fakeLength, node.symbol, node.blank, node.__key);
    }

    createDOM(config: EditorConfig, editor?: LexicalEditor | undefined): HTMLElement {
        
        const elem = super.createDOM(config, editor);

        if (this.symbol) {
        
            elem.replaceChildren(SpacerTextNode.ICON.firstElementChild!.cloneNode(true));
        
        } else if (this.blank) {

            return elem;

        } else {

            if (this.strikethrough) { // Rejected addition
        
                elem.replaceChildren(SpacerTextNode.REJECTED_ADDITION_ICON.firstElementChild!.cloneNode(true));

            } else { // Accepted removal

                elem.replaceChildren(SpacerTextNode.ACCEPTED_REMOVAL_ICON.firstElementChild!.cloneNode(true));
            }
        }

        console.log(elem);

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

export function $createSpacerTextNode(strikethrough?: boolean, fakeLength?: number, symbol?: boolean, blank?: boolean): SpacerTextNode {
    
    const strike = strikethrough === undefined ? false : strikethrough;
    const length = fakeLength === undefined ? 1 : fakeLength;
    const blank1 = blank === undefined ? false : blank;

    return new SpacerTextNode(strike, length, symbol, blank1);
}