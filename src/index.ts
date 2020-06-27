import {FrpArray} from "./frp/frparray";
import {div} from "./frpdom/div";
import {FrpDOM, FrpElement, FrpHTMLElement} from "./frpdom/frpdom";
import {button} from "./frpdom/button";
import {Todo, TodoApp, TodoList} from "./model";
import {textInput} from "./frpdom/textInput";

function todoView(todo: Todo): FrpElement {
    return div({
        children: [
            `Todo: ${todo.content}`
        ]
    });
}

function todoListView(todoList: TodoList): FrpElement {
    const buttonAdd = button({child: "Add"});
    const nameInput = textInput();

    todoList.sAdd.loop(buttonAdd.sPressed.snapshot1(nameInput.cText));

    return div({
        children: [
            div({children: [`Todo list: ${todoList.name}`]}),
            nameInput,
            buttonAdd,
            div({children: todoList.aTodos.map(todoView)}),
        ]
    });
}

function root(): FrpHTMLElement {
    const todoApp = new TodoApp();
    return div({
        children: new FrpArray<FrpElement>([
            div({children: ["Todo app"]}),
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
