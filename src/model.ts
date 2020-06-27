import {LazyGetter} from 'lazy-get-decorator';
import {Cell, CellLoop, StreamLoop, StreamSink, Unit} from "sodiumjs";
import {FrpArray, FrpArrayChange} from "./frp/frparray";

export class Todo {
    constructor(
        readonly content: string,
    ) {
    }
}


export class TodoList {
    readonly sAdd = new StreamLoop<string>();

    readonly aTodos = new FrpArray([
        new Todo("Buy milk"),
        new Todo("Buy carrots"),
    ], this.sAdd.map((name) => new FrpArrayChange({
        inserts: new Map([[
            0,
            [new Todo(`Buy ${name}`)],
        ]]),
    })));

    constructor(
        readonly name: String,
    ) {
    }
}

export class TodoApp {
    // readonly sCreate = new StreamSink<Unit>();

    @LazyGetter()
    get cTodoList(): Cell<TodoList> {
        // return this.sReset
        //     .map(() => new Editor())
        //     .hold(new Editor());
        return new Cell(new TodoList("Shopping list"));
    }
}
