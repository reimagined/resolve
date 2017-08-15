import { expect } from 'chai';
import { Selector } from 'testcafe';

const host = process.env.HOST || 'localhost';
const MAIN_PAGE = `http://${host}:3000`;

const FIRST_TODO = 'First todo';
const SECOND_TODO = 'Second todo';

const createTodo = async (t, title) => {
  await t.typeText(await Selector('form input'), title).pressKey('enter');
};

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Todo list example`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true);
  await t.navigateTo(MAIN_PAGE);
});

test('base functionality', async t => {
  /* Create items */ {
    await createTodo(t, FIRST_TODO);
    await createTodo(t, SECOND_TODO);

    const items = Selector('ul li');

    expect(await items.count).to.be.equal(2);
    expect(await items.nth(0).innerText).to.contain(FIRST_TODO);
    expect(await items.nth(1).innerText).to.contain(SECOND_TODO);
  }

  /* Complete item */ {
    const todo = Selector('ul li').nth(0);
    await t.click(todo);
    expect(await todo.getStyleProperty('text-decoration')).to.be.equal('line-through solid rgb(0, 0, 0)');
  }

  /* Filters */ {
    const activeLink = Selector('a').withText('Active');
    await t.click(activeLink);
    const activeItems = Selector('ul li');
    expect(await activeItems.count).to.be.equal(1);
    expect(await activeItems.nth(0).innerText).to.contain(SECOND_TODO);

    const completedLink =  Selector('a').withText('Completed');
    await t.click(completedLink);
    const completedItems = Selector('ul li');
    expect(await completedItems.count).to.be.equal(1);
    expect(await completedItems.nth(0).innerText).to.contain(FIRST_TODO);

    const allLink = Selector('a').withText('All');
    await t.click(allLink);
    const allItems = Selector('ul li');
    expect(await allItems.count).to.be.equal(2);
  }

  /* Reset item */ {
    const todo = Selector('ul li').nth(0);
    await t.click(todo);
    expect(await todo.getStyleProperty('text-decoration')).to.be.equal('none solid rgb(0, 0, 0)');
  }
});
