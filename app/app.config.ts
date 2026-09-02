export default defineAppConfig({
  ui: {
    colors: {
      primary: 'creup-red',
      secondary: 'creup-blue',
    },
    toast: {
      slots: {
        title: 'text-sm font-medium text-highlighted select-text',
        description: 'text-sm text-muted select-text',
      },
    },
    // The soft variant paints the copy in its own colour over a 10% tint of the same colour, which
    // on `warning` measures 2:1 against the tint — half of what WCAG AA asks for. The colour stays
    // on the icon and the background, where it still reads as the severity cue, and the words
    // switch to the ordinary foreground, matching what `toast` above already does.
    alert: {
      slots: {
        title: 'text-sm font-medium text-highlighted',
        description: 'text-sm text-toned',
      },
    },
  },
})
