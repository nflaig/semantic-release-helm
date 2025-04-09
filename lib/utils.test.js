const utils = require('././utils')

it('use env var as first choice for chart path', () => {
  const expected = "foo";
  const env = {CHART_PATH : expected };
  const pluginConfig = { chartPath: "bar" };
  const cwd = "baz"

  const actual = utils.getChartPath(pluginConfig, { env, cwd })

  expect(actual).toBe(expected);
});

it('use argument as second choice for chart path', () => {
  const expected = "foo";
  const env = { CHART_PATH : null };
  const pluginConfig = { chartPath: expected };
  const cwd = "baz"

  const actual = utils.getChartPath(pluginConfig, { env, cwd })

  expect(actual).toBe(expected);
});

it('fallback to current working directory for chart path', () => {
  const expected = "foo";
  const env = {CHART_PATH : null };
  const pluginConfig = { chartPath: null };
  const cwd = expected;

  const actual = utils.getChartPath(pluginConfig, { env, cwd })

  expect(actual).toBe(expected);
});
