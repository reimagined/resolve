import { expect } from 'chai';
import { Selector } from 'testcafe';

const host = process.env.HOST || 'localhost';
const MAIN_PAGE = `http://${host}:3000`;

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Todo list example`.beforeEach(async (t) => {
    await t.setNativeDialogHandler(() => true);
    await t.navigateTo(MAIN_PAGE);
});

test('base functionality', async (t) => {
    const openSidebarButton = await Selector('button').withText('Open Menu');
    await t.click(openSidebarButton);

    await t.wait(500);

    const newItemInput = await Selector('.bm-menu input');
    const newItemButton = await Selector('.bm-menu button').withText('Add');

    await t.typeText(newItemInput, 'First', { replace: true }).click(newItemButton);

    const firstItem = await Selector('.bm-menu a').withText('First');

    await t
        .click(firstItem)
        .typeText(await Selector('input.new-todo'), 'First todo')
        .pressKey('enter');

    const firstTodoItems = Selector('.todo-list li');

    expect(await firstTodoItems.count).to.be.equal(1);
    expect(await firstTodoItems.nth(0).innerText).to.contain('First todo');

    await t.typeText(newItemInput, 'Second', { replace: true }).click(newItemButton);

    const secondItem = await Selector('.bm-menu a').withText('Second');

    await t
        .click(secondItem)
        .typeText(await Selector('input.new-todo'), 'Second todo')
        .pressKey('enter');

    const secondTodoItems = Selector('.todo-list li');

    expect(await secondTodoItems.count).to.be.equal(1);
    expect(await secondTodoItems.nth(0).innerText).to.contain('Second todo');

    await t.click(await Selector('#sidebar-list a').withText('All'));

    const allTodoItems = Selector('.todo-list li');

    expect(await allTodoItems.count).to.be.equal(2);
    expect(await allTodoItems.nth(0).innerText).to.contain('First todo');
    expect(await allTodoItems.nth(1).innerText).to.contain('Second todo');

    await t.click(Selector('#sidebar-list .destroy').nth(0));
    expect(await Selector('.todo-list li').count).to.be.equal(1);

    await t.click(Selector('#sidebar-list .destroy').nth(0));
    expect(await Selector('.todo-list li').count).to.be.equal(0);
});
