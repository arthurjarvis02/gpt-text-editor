"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PopoverClose } from "@radix-ui/react-popover";
import { $applyNodeReplacement, $createParagraphNode, $createPoint, $createRangeSelection, $createTextNode, $getNodeByKey, $getRoot, $getSelection, $insertNodes, $isElementNode, $isRangeSelection, $isTextNode, $selectAll, $setSelection, RangeSelection } from "lexical";
import { Sparkles } from "lucide-react";
import { useAppDispatch } from "@/lib/hooks";
import { fetchEdits } from "@/lib/features/ai/aiSlice";
import { useState } from "react";

export default function AiMenuButton({children, ...props}: ButtonProps) {

    const [isOpen, setIsOpen] = useState(false);
    const [editor] = useLexicalComposerContext();
    const dispatch = useAppDispatch();

    const suggestions = ["summarise", "paraphrase", "correct spelling and grammar", "more formal"]

    const handleClick = (prompt: string) => {

        editor.update(() => {

            const selection = $getSelection();
            
            if (!$isRangeSelection(selection)) return;

            const originalText = selection.getTextContent();

            const points = selection.getStartEndPoints()
            if (!points) return;

            let startPoint = points[selection.isBackward() ? 1 : 0];

            const startNode = $getNodeByKey(startPoint.key);
            if (!startNode) return;

            if ($isTextNode(startNode)) {

                const parentNode = startNode.getParent();
                if (!parentNode) return;

                startPoint = $createPoint(parentNode.getKey(), startNode.getIndexWithinParent(), "element");
            }

            console.log(startPoint);

            dispatch(fetchEdits({prompt, originalText, startPoint: {key: startPoint.key, offset: startPoint.offset, type: startPoint.type}}));
        });
    }
    
    return (
        <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
                <Button {...props}>
                    <Sparkles className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                {suggestions.map(suggestion => (
                    <PopoverClose key={suggestion} asChild>
                        <Button key={suggestion} className="rounded-full m-1" variant="outline" onClick={() => handleClick(suggestion)}>{suggestion}</Button>
                    </PopoverClose>
                ))}
            </PopoverContent>
        </Popover>
    )
}