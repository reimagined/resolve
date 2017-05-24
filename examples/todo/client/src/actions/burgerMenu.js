export const TOGGLE_MENU = 'TOGGLE_MENU';

const toggleMenu = (isOpen = false) => {
    return {
        type: TOGGLE_MENU,
        payload: { isOpen }
    };
};

export default toggleMenu;
