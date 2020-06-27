import {FrpElement, FrpHTMLElement} from "./frpdom";
import {FrpArray} from "../frp/frparray";
import {LazyGetter} from "lazy-get-decorator";
import {buildNode, swapElements} from "./utils";
import {Cell, Stream, StreamSink} from "sodiumjs";

export class FrpHTMLTextInputElement extends FrpHTMLElement {
    readonly cText: Cell<string>;

    private readonly sInputChanged = new StreamSink<string>();

    constructor(props: {
        initialText?: string,
        sSubstituteText?: Stream<string>,
    }) {
        super();
        const sSubstituteText = props.sSubstituteText ?? new Stream<string>();
        this.cText = sSubstituteText
            .orElse(this.sInputChanged)
            .hold(props.initialText ?? "");
    }

    @LazyGetter()
    get htmlElement(): HTMLElement {
        const inputElement = document.createElement("input");

        // TODO: Unlisten
        inputElement.addEventListener('input', (e) => {
            this.sInputChanged.send(inputElement.value);
        });

        return inputElement;
    }
}

export function textInput(props?: {
    initialText?: string,
    sSubstituteText?: Stream<string>,
}): FrpHTMLTextInputElement {
    return new FrpHTMLTextInputElement(props ?? {});
}
