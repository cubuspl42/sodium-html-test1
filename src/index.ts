import { FrpArray } from "./frp/frparray";
import { div } from "./frpdom/div";
import { FrpDOM, FrpElement, FrpHTMLElement } from "./frpdom/frpdom";
import { button } from "./frpdom/button";
import { Todo, TodoApp, TodoList } from "./model";
import { textInput } from "./frpdom/textInput";
import { FrpHTMLCheckboxElement } from "./frpdom/checkbox";
import { Cell, CellLoop, Operational, Stream, StreamLoop, Transaction } from "sodiumjs";

import "./style.css";

function todoView(todo: Todo): FrpElement {
    const checkbox = new FrpHTMLCheckboxElement({
        initialChecked: todo.cDone.sample(),
    });

    const buttonRemove = button({ child: "X" });

    todo.sSetDone.loop(Operational.updates(checkbox.cChecked));
    todo.sRemove.loop(buttonRemove.sPressed);

    return div({
        className: todo.cDone.map<string>(
            (d) => d ? "todo-done" : "",
        ),
        children: [
            checkbox,
            `Todo: ${todo.content}`,
            buttonRemove,
        ]
    });
}

function todoListView(todoList: TodoList): FrpElement {
    const buttonAdd = button({ child: "Add" });
    const nameInput = textInput();

    todoList.sAdd.loop(buttonAdd.sPressed.snapshot1(nameInput.cText));

    return div({
        children: [
            div({ children: [`Todo list: ${todoList.name}`] }),
            div({
                children: [
                    div({
                        children: [
                            todoList.aTodos.cLength.map<FrpElement | null>(
                                (l) => `Number of todos: ${l}`,
                            ),
                        ]
                    }),
                    div({
                        children: [
                            todoList.cDoneTodosCount.map<FrpElement | null>(
                                (n) => `Number of done todos: ${n}`,
                            ),]
                    }),
                ]
            }),
            nameInput,
            buttonAdd,
            div({ children: todoList.aTodos.map(todoView) }),
        ]
    });
}

function root(): FrpHTMLElement {
    const todoApp = new TodoApp();
    return div({
        children: FrpArray.hold<FrpElement>([
            div({ children: ["Todo app"] }),
            div({
                children: [
                    todoApp.cTodoList.map<FrpElement | null>(todoListView),
                ]
            }),
        ]),
    });
}

FrpDOM.render(
    root,
    document.getElementById("root")!,
);
