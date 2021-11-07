import type { Context } from "semantic-release";
import prepare from "./prepare";

test("prepare", async () => {
  const context: Context = {
    env: {},
    logger: {
      error() {},
      log() {},
    },
  };
  const result = await prepare({}, context);
  expect(result).toBeTruthy();
});
