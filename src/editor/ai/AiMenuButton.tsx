"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PopoverClose } from "@radix-ui/react-popover";
import { $getSelection, $isRangeSelection, RangeSelection } from "lexical";
import { History, Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchEdits } from "@/lib/features/ai/aiSlice";
import React, { useEffect, useState } from "react";
import { serializePoint } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { updateSession } from "@/lib/features/sessions/sessionsSlice";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver} from "@hookform/resolvers/zod";
import { markSelection } from "@lexical/utils";
import { $patchStyleText } from "@lexical/selection";

export default function AiMenuButton({children, ...props}: ButtonProps) {

    const [isOpen, setIsOpen] = useState(false);
    const [editor] = useLexicalComposerContext();
    const dispatch = useAppDispatch();
    const [customPrompt, setCustomPrompt] = useState("");
    const currentSessionId = useAppSelector(state => state.ai.currentSessionId);
    const [selection, setSelection] = useState<RangeSelection | null>(null);

    if (!currentSessionId) return;

    const prevCustomEdits = useAppSelector(state => state.sessions.sessions[currentSessionId]?.prevCustomEdits || []) as string[];

    const suggestions = ["summarise", "paraphrase", "expand", "more formal", "less formal", "correct spelling/grammar"];

    const customPromptSchema = z.object({
        prompt: z.string().nonempty()
    });

    const form = useForm<z.infer<typeof customPromptSchema>>({
        resolver: zodResolver(customPromptSchema),
        defaultValues: {
            prompt: ""
        }
    })

    const handlePrompt = (prompt: string) => {

        editor.update(() => {

            if (!selection) return;

            const originalText = selection.getTextContent();

            const points = selection.getStartEndPoints()
            if (!points) return;

            const startPoint = serializePoint(points[selection.isBackward() ? 1 : 0]);
            const endPoint = serializePoint(points[selection.isBackward() ? 0 : 1]);

            dispatch(fetchEdits({prompt, originalText, startPoint}));
        });
    }

    const handleCustomPrompt = (prompt: string) => {

        const updatedPrevCustomEdits = prevCustomEdits.filter(prev => prev !== prompt);
        
        dispatch(updateSession({
            id: currentSessionId,
            prevCustomEdits: [prompt, ...updatedPrevCustomEdits].slice(0, 3)
        }));

        handlePrompt(prompt);
    }

    const handleCustom = (values: z.infer<typeof customPromptSchema>) => {

        setIsOpen(false);

        handleCustomPrompt(values.prompt);
    }

    useEffect(() => {

        if (isOpen) {

            form.reset();

            const getSelection = () => editor.update(() => {

                const editorSelection = $getSelection();

                if ($isRangeSelection(editorSelection) && !editorSelection.getStartEndPoints()![0]!.is(editorSelection.getStartEndPoints()![1]!)) {

                    setSelection(editorSelection);

                } else {

                    setSelection(null);
                }
            });

            getSelection();

            return editor.registerUpdateListener(getSelection);
        }

    }, [editor, isOpen]);

    if (!selection) return (

        <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
                <Button {...props}>
                    <Sparkles className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <p>Select some text to get started</p>
            </PopoverContent>
        </Popover>
    );

    return (
        <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
                <Button {...props}>
                    <Sparkles className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[512px] space-y-2">

                <h2 className="text-md font-semibold">Recommended prompts</h2>
                <div className="-m-1">

                    {suggestions.map(suggestion => (
                        <PopoverClose key={suggestion} asChild>
                            <Button
                                size="sm"
                                key={suggestion}
                                className="justify-start m-1 rounded-full max-w-full"
                                variant="outline" 
                                onClick={() => handlePrompt(suggestion)}
                            >
                                <span className="truncate">{suggestion}</span>
                            </Button>
                        </PopoverClose>
                    ))}

                </div>
                
                <h2 className="text-md font-semibold">Custom prompts</h2>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCustom)}>
                        <FormField control={form.control} name="prompt" render={({field}) => (

                            <FormItem>
                                <FormControl>
                                    <Input {...field} placeholder="Enter a custom prompt" />
                                </FormControl>
                            </FormItem>

                        )} />
                    </form>
                </Form>

                <div className="-m-1">
                    {prevCustomEdits.map(suggestion => (
                        <PopoverClose key={suggestion} asChild>
                            <Button
                                size="sm"
                                key={suggestion}
                                className="justify-start m-1 rounded-full max-w-full"
                                variant="outline" 
                                onClick={() => handlePrompt(suggestion)}
                            >
                                <History className="w-4 h-4 mr-2 stroke-gray-500" />
                                <span className="truncate">{suggestion}</span>
                            </Button>
                        </PopoverClose>
                    ))}
                </div>

            </PopoverContent>
        </Popover>
    )
}