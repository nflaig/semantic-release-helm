# semantic-release-helm

This is a plugin for _semantic-release_. It updates `version` and `appVersion` of a [Helm](https://helm.sh/) chart's
_Chart.yaml_.

The `version` is increased according to `nextRelease.type`, which can be one of

- major
- premajor
- minor
- preminor
- patch
- prepatch
- prerelease

or _null_ if it's not valid.

The `appVersion` is set to `nextRelease.version` if `onlyUpdateVersion`is false or unset.

## BREAKING CHANGE in v2

`path` has been renamed to `chartPath` to prevent config conflicts.

##### Examples:

```
version 0.1.0  
appVersion 1.16.0
```

1. patch (1.16.0 -> 1.16.1)  
   New chart version is 0.1.1

2. minor (1.16.0 -> 1.17.0)  
   New chart version is 0.2.0

3. major (1.16.0 -> 2.0.0)  
   New chart version is 1.0.0

## Configuration

- chartPath (required) - string
  Chart directory, where the _Chart.yaml_ is located.

- registry (optional) - string  
  URI of a container registry.

- onlyUpdateVersion (optional) - boolean (default: false)  
  Don't change `appVersion` if this is true. Useful if your chart is in a different git repo than the application.

- crPublish (optional) - boolean  
  Enable chart-releaser publishing

- crConfigPath (optional) - string  
  Path to .ct.yaml chart-releaser configuration file.

Pass credentials through environment variables accordingly:

```
export REGISTRY_USERNAME=<USERNAME>
export REGISTRY_PASSWORD=<PASSWORD>
```

For S3 pass the AWS credentials as environment variables:

```
export AWS_REGION=<REGION>
export AWS_ACCESS_KEY_ID=<ACCESS_KEY_ID>
export AWS_SECRET_ACCESS_KEY=<SECRET_ACCESS_KEY>
```

## Example

This will update `version` and `appVersion` in `./chart/Chart.yaml`
and push the chart to `localhost:5000/repo/chart`. The image will be tagged with the value of `version` from
_Chart.yaml_.

```
{
  "plugins": [
    [
      "semantic-release-helm",
      {
        chartPath: './chart',
        registry: 'localhost:5000/repo/chart'
      }
    ]
  ]
}
```

## S3 Example

The [helm-s3](https://github.com/hypnoglow/helm-s3) plugin adds support for S3. Check the documentation for additional
options

This will update `version` in `./chart/Chart.yaml`
and push the chart to `s3://my-s3-bucket/s3-prefix`. The image will be tagged with the value of `version` from
_Chart.yaml_.

```
{
  "plugins": [
    [
      "semantic-release-helm",
      {
        chartPath: './chart',
        registry: 's3://my-s3-bucket-repo/s3-prefix',
        onlyUpdateVersion: true,
      }
    ]
  ]
}
```
