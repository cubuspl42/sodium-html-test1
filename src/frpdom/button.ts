import { FrpElement, FrpHTMLElement } from "./frpdom";
import { FrpArray } from "../frp/frparray";
import { LazyGetter } from "lazy-get-decorator";
import { Cell, Stream, StreamSink, Unit } from "sodiumjs";
import { buildNode } from "./utils";

export class FrpHTMLButtonElement extends FrpHTMLElement {
    private readonly child: Cell<FrpElement>;

    constructor(props: {
        child: Cell<FrpElement> | FrpElement,
    }) {
        super();
        this.child = props.child instanceof Cell ?
            props.child :
            new Cell(props.child);
    }

    @LazyGetter()
    get htmlElement(): HTMLButtonElement {
        const parentElement = document.createElement("button");

        const childNode = buildNode(this.child.sample());
        parentElement.appendChild(childNode);

        // TODO: Unlisten
        this.child.listen((c) => {
            parentElement.removeChild(parentElement.firstChild!);
            parentElement.appendChild(buildNode(c));
        });

        return parentElement;
    }

    @LazyGetter()
    get sPressed(): Stream<Unit> {
        const buttonElement = this.htmlElement;
        const sink = new StreamSink<Unit>();

        // TODO: Unlisten
        buttonElement.addEventListener("click", (event) => {
            sink.send(Unit.UNIT);
        });

        return sink;
    }
}

export function button(props: {
    child: Cell<FrpElement> | FrpElement,
}): FrpHTMLButtonElement {
    return new FrpHTMLButtonElement(props);
}
