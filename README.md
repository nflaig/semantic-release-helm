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

- path (required)  
Chart directory, where the _Chart.yaml_ is located.

- registry (optional)  
URI of a container registry.

## Example

This will update versions in `./chart/Chart.yaml`
and push the chart to `localhost:5000/repo/chart`.
The image will be tagged with the value of `version` from _Chart.yaml_.

```
{
  "plugins": [
    [
      "semantic-release-helm",
      {
        path: './chart',
        registry: 'localhost:5000/repo/chart'
      }
    ]
  ]
}
```
