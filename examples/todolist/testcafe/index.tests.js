import { expect } from 'chai';
import { Selector } from 'testcafe';

const MAIN_PAGE = 'http://todolist:3000';

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Todo list example`.beforeEach(async (t) => {
    await t.setNativeDialogHandler(() => true);
    await t.navigateTo(MAIN_PAGE);
});

test('initial state', async () => {
    const title = await Selector('h1').innerText;
    expect(title).to.be.equal('CardList');

    const itemsCount = await Selector('ul').child().count;
    expect(itemsCount).to.be.equal(0);
});

test('add item', async (t) => {
    const itemsInput = await Selector('input.form-control');
    await t.typeText(itemsInput, 'new item', { replace: true });

    const addButton = await Selector('button').withText('Add');
    await t.click(addButton);

    await t.typeText(itemsInput, 'new item1', { replace: true });
    await t.click(addButton);

    const itemsCount = await Selector('ul').child().count;
    expect(itemsCount).to.be.equal(2);
});

test('delete item', async (t) => {
    const deleteButton = await Selector('a')
        .withText('new item1')
        .parent(0)
        .sibling(0)
        .find('button');

    await t.click(deleteButton);

    const itemsCount = await Selector('ul').child().count;
    expect(itemsCount).to.be.equal(1);
});

test('add todos in new item', async (t) => {
    const newItem = await Selector('a').withText('new item');
    await t.click(newItem);

    const title = await Selector('h2').innerText;
    expect(title).to.be.equal('Todo List:');

    const itemsInput = await Selector('input.form-control');
    await t.typeText(itemsInput, 'todo', { replace: true });

    const addButton = await Selector('button').withText('Add');
    await t.click(addButton);

    await t.typeText(itemsInput, 'todo1', { replace: true });
    await t.click(addButton);

    const todosCount = await Selector('ul').child().count;
    expect(todosCount).to.be.equal(2);
});

test('check todo', async (t) => {
    const newItem = await Selector('a').withText('new item');
    await t.click(newItem);

    const todo = await Selector('button').withText('todo');
    await t.click(todo);

    const checkedTodosCount = await Selector('i').withAttribute('class', 'fa fa-check-square-o')
        .count;
    expect(checkedTodosCount).to.be.equal(1);
});
