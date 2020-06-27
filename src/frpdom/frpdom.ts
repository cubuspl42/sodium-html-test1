import {Transaction} from "sodiumjs";

export abstract class FrpHTMLElement {
    abstract get htmlElement(): HTMLElement;
}

export type FrpElement = FrpHTMLElement | string;

export class FrpDOM {
    static render(
        build: () => FrpHTMLElement,
        container: HTMLElement,
    ): void {
        Transaction.run(() => {
            const element = build();
            container.appendChild(element.htmlElement);
        });
    }
}
