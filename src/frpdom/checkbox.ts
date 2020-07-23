import {FrpElement, FrpHTMLElement} from "./frpdom";
import {FrpArray} from "../frp/frparray";
import {LazyGetter} from "lazy-get-decorator";
import {buildNode, swapElements} from "./utils";
import {Cell, Stream, StreamSink} from "sodiumjs";

export class FrpHTMLCheckboxElement extends FrpHTMLElement {
    readonly cChecked: Cell<boolean>;

    private readonly sStateChanged = new StreamSink<boolean>();

    constructor(props?: {
        initialChecked?: boolean,
        sCheck?: Stream<boolean>,
    }) {
        super();
        const sCheck = props?.sCheck ?? new Stream<boolean>();
        this.cChecked = sCheck
            .orElse(this.sStateChanged)
            .hold(props?.initialChecked ?? false);
    }

    @LazyGetter()
    get htmlElement(): HTMLElement {
        const inputElement = document.createElement("input");
        inputElement.type = "checkbox";

        // TODO: Unlisten
        inputElement.addEventListener('change', (e) => {
            const element = e.target as HTMLInputElement
            this.sStateChanged.send(element.checked);
        });

        return inputElement;
    }
}

export function checkbox(props?: {
    initialChecked?: boolean,
    sCheck?: Stream<boolean>,
}): FrpHTMLCheckboxElement {
    return new FrpHTMLCheckboxElement(props ?? {});
}
