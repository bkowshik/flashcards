// Shared keyboard-shortcut reference rendered on the About page. Lives in
// its own module so the data stays decoupled from the runtime handler in
// `shortcuts.ts` (which intentionally has no UI strings).

export type ShortcutGroup = {
  heading: string;
  rows: [keys: string, description: string][];
};

export const shortcutGroups: ShortcutGroup[] = [
  {
    heading: 'Navigation',
    rows: [
      ['g a', 'Go to Add'],
      ['g b', 'Go to Browse'],
      ['g q', 'Go to Quiz'],
    ],
  },
  {
    heading: 'Add / Edit',
    rows: [
      ['⌘/Ctrl + Enter', 'Save card'],
      ['Esc', 'Clear (Add) or Cancel (Edit)'],
    ],
  },
  {
    heading: 'Quiz',
    rows: [
      ['Space', 'Flip card'],
      ['n  or  →', 'Next card'],
      ['p  or  ←', 'Previous card'],
      ['e', 'Edit current card'],
    ],
  },
];
