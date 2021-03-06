import { FrpElement, FrpHTMLElement } from "./frpdom";
import { FrpArray } from "../frp/frparray";
import { LazyGetter } from "lazy-get-decorator";
import { buildNode, swapElements } from "./utils";
import { Cell } from "sodiumjs";

function toFrpArray(cellArray: ReadonlyArray<Cell<FrpElement | null> | FrpElement>): FrpArray<FrpElement> {
    const cellOnlyArray: ReadonlyArray<Cell<FrpElement | null>> =
        cellArray.map(
            (child) => child instanceof Cell ?
                child :
                new Cell<FrpElement | null>(child),
        );
    // return FrpArray.filterNotNull(FrpArray.fromCellArray(cellOnlyArray));
    return FrpArray.meltStatic(cellOnlyArray).map((e) => e!);
}

function toCell<A>(a: Cell<A> | A) {
    return a instanceof Cell ? a : new Cell(a);
}

export class FrpHTMLDivElement extends FrpHTMLElement {
    private readonly className: Cell<string> | undefined;

    private readonly children: FrpArray<FrpElement>;

    constructor(props: {
        className?: Cell<string> | string,
        children: FrpArray<FrpElement> | ReadonlyArray<Cell<FrpElement | null> | FrpElement>,
    }) {
        super();

        this.className = props.className !== undefined ? toCell(props.className) : undefined;

        const children = props.children;
        this.children = children instanceof FrpArray ?
            children :
            toFrpArray(children);
    }

    @LazyGetter()
    get htmlElement(): HTMLElement {
        const parentElement = document.createElement("div");

        // TODO: Unlisten
        this.className?.listen((cn) => {
            parentElement.className = cn;
        });

        this.children.sample().forEach((element) => {
            const childNode = buildNode(element);
            parentElement.appendChild(childNode);
        });

        // TODO: Unlisten
        this.children.sChange.listen((c) => {
            c.updates?.forEach((element, index) => {
                const oldNode = parentElement.childNodes[index];
                const newNode = buildNode(element);
                parentElement.replaceChild(newNode, oldNode);
            });

            c.swaps?.forEach((targetIndex, sourceIndex) => {
                const node1 = parentElement.childNodes[sourceIndex];
                const node2 = parentElement.childNodes[targetIndex];
                swapElements(node1, node2);
            });

            const deletes = c.deletes ?? new Set();
            const deletedNodes = [...deletes.values()].map(
                (index) => parentElement.childNodes[index],
            );

            c.inserts?.forEach((elements, index) => {
                const newNodes = elements.map(buildNode);

                let node: Node = parentElement.childNodes[index];
                newNodes.reverse().forEach((newNode) => {
                    node = parentElement.insertBefore(newNode, node);
                })
            });

            deletedNodes.forEach((node) => {
                parentElement.removeChild(node);
            });
        });

        return parentElement;
    }
}

export function div(props: {
    className?: Cell<string> | string,
    children: FrpArray<FrpElement> | ReadonlyArray<Cell<FrpElement | null> | FrpElement>,
}): FrpHTMLDivElement {
    return new FrpHTMLDivElement(props);
}
