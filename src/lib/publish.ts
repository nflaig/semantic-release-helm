import type { Context } from "semantic-release";
import { PluginConfig } from "../types";

export default async (pluginConfig: PluginConfig, context: Context) => {
  console.log(pluginConfig);
  console.log(context);

  return true;
};
