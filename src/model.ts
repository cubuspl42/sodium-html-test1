import {LazyGetter} from 'lazy-get-decorator';
import {Cell, CellLoop, Stream, StreamLoop, StreamSink, Unit} from "sodiumjs";
import {FrpArray, FrpArrayChange, FrpArrayLoop} from "./frp/frparray";

export class Todo {
    constructor(
        readonly content: string,
    ) {
    }

    readonly sSetDone = new StreamLoop<boolean>();

    readonly sRemove = new StreamLoop<Unit>();

    readonly cDone = this.sSetDone.hold(false);
}


export class TodoList {
    readonly sAdd: StreamLoop<string>;

    readonly aTodos: FrpArray<Todo>;

    constructor(
        readonly name: String,
    ) {
        const aTodosLoop = new FrpArrayLoop<Todo>();

        const sAdd = new StreamLoop<string>();

        const sRemove: Stream<Map<number, Unit>> =
            aTodosLoop.flatMapS((t) => t.sRemove);

        const sAddChange = sAdd.map((name) => {
            return aTodos.pushChange([
                new Todo(`Buy ${name}`),
            ]);
        });

        const sRemoveChange = sRemove.map((m) =>
            new FrpArrayChange<Todo>({
                deletes: new Set(m.keys()),
            })
        );

        const aTodos: FrpArray<Todo> = FrpArray.hold(
            [
                new Todo("Buy milk"),
                new Todo("Buy carrots"),
            ],
            sAddChange.merge(sRemoveChange,
                (a, r) => a.union(r),
            ),
        );

        aTodosLoop.loop(aTodos);

        this.sAdd = sAdd;
        this.aTodos = aTodos;
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
