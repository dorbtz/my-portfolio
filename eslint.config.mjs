import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ["legacy/**", ".next/**", "out/**", "node_modules/**"],
  },
];

export default eslintConfig;
