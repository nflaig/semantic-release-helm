# semantic-release-helm

This is a plugin for _semantic-release_.
It updates `version` and `appVersion` of a Helm chart's _Chart.yaml_. 

The `version` is increased according to `nextRelease.type`,
which can be one of

- major
- premajor
- minor
- preminor
- patch
- prepatch
- prerelease

or _null_ if it's not valid.

The `appVersion` is set to `nextRelease.version`.

## Configuration

The plugin requires a single option `chartPath`
which points to the chart directory,
where the _Chart.yaml_ is located.

```
{
  "plugins": [
    [
      "semantic-release-helm",
      {
        chartPath: '/path/to/chart'
      }
    ]
  ]
}
```
