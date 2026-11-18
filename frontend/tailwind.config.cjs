# tailwind.config.cjs
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#101112",
        surface: "#191B1D",
        raised: "#222528",
        border: "#34383B",
        primary: "#F0F1F2",
        secondary: "#A0A5AA",
        muted: "#70777D",
        success: "#63C995",
        warning: "#E3B45F",
        danger: "#E36F6F",
        info: "#6FA9DC",
      },
    },
  },
  plugins: [],
};
