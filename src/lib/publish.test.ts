import type { Context } from "semantic-release";
import publish from "./publish";

test("publish", async () => {
  const context: Context = {
    env: {},
    logger: {
      error() {},
      log() {},
    },
  };
  const result = await publish({}, context);
  expect(result).toBeTruthy();
});
