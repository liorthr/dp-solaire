import next from "eslint-config-next";

export default [
  ...next,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
];
