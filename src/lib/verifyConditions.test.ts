import type { Context } from "semantic-release";
import verifyConditions from "./verifyConditions";

test("verifyConditions", async () => {
  const context: Context = {
    env: {},
    logger: {
      error() {},
      log() {},
    },
  };
  const result = await verifyConditions({}, context);
  expect(result).toBeTruthy();
});
