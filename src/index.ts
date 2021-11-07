import type { Context } from "semantic-release";
import _verifyConditions from "./lib/verifyConditions";
import _prepare from "./lib/prepare";
import _publish from "./lib/publish";
import { PluginConfig } from "./types";

let verified = false;
let prepared = false;

async function verifyConditions(pluginConfig: PluginConfig, context: Context) {
  await _verifyConditions(pluginConfig, context);
  verified = true;
}

async function prepare(pluginConfig: PluginConfig, context: Context) {
  if (!verified) {
    await _verifyConditions(pluginConfig, context);
  }

  await _prepare(pluginConfig, context);
  prepared = true;
}

async function publish(pluginConfig: PluginConfig, context: Context) {
  if (!verified) {
    await _verifyConditions(pluginConfig, context);
  }
  if (!prepared) {
    await _prepare(pluginConfig, context);
  }

  await _publish(pluginConfig, context);
}

export { verifyConditions, prepare, publish };
