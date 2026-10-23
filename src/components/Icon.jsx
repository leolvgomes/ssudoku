const paths = {
  sound: <path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />,
  muted: <path d="m11 5-6 4H2v6h3l6 4zM16 9l5 6m0-6-5 6" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3h.01" /></>,
  pause: <path d="M9 5v14M15 5v14" />,
  play: <path d="m8 5 11 7-11 7z" />,
  undo: <path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14" />,
  erase: <path d="m14 3 7 7-11 11H6l-4-4zM8 11l7 7M10 21h12" />,
  notes: <path d="m16 3 5 5-12 12-6 1 1-6zM13 6l5 5M3 21h18" />,
  hint: <path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z" />,
};
export default function Icon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
