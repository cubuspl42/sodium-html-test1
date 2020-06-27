import {FrpElement, FrpHTMLElement} from "./frpdom";

export function buildNode(element: FrpElement): Node {
    return element instanceof FrpHTMLElement ?
        element.htmlElement :
        document.createTextNode(element);
}

export function swapElements(node1: Node, node2: Node) {
    const marker = document.createElement("div");
    node1.parentNode?.insertBefore(marker, node1);
    node2.parentNode?.insertBefore(node1, node2);
    marker.parentNode?.insertBefore(node2, marker);
    marker.parentNode?.removeChild(marker);
}
