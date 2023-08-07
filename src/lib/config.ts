import { config as envconfig } from "dotenv";

const envWithKeys: envFunction = keys => {
  const env = envconfig().parsed;

  if (!env) throw new Error("No enviroment variables found!");

  for (const key of keys) {
    if (!env[key]) throw new Error(`Missing enviroment variable: ${key}`);
  }

  return env as any;
};

type envFunction = <T extends string>(keys: T[]) => { [K in T]: string };

export const config = envWithKeys(["CLIENT_ID", "CLIENT_TOKEN", "CLIENT_KEY"]);
