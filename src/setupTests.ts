import "@testing-library/jest-dom";

const style = document.createElement("style");
style.innerHTML = `
.mt-0 { margin-top: 0; }
.mt-8 { margin-top: 2rem; }
.pb-12 { padding-bottom: 3rem; }
.gap-6 { gap: 1.5rem; }
`;
document.head.appendChild(style);
