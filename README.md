# semantic-release-helm3

[semantic-release](https://github.com/semantic-release/semantic-release) plugin to publish [Helm](https://helm.sh/) charts.

[![Latest version][npm-version-badge]][npm-package]
[![License][license-badge]][license]
[![Downloads][npm-downloads-badge]][npm-package]
[![Total Downloads][npm-total-downloads-badge]][npm-package]

| Step               | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `verifyConditions` | Verify required configuration and login to Helm registry. |
| `prepare`          | Update `version` and/or `appVersion` in _Chart.yaml_.     |
| `publish`          | Publish Helm chart to registry.                           |

> **NOTE:** This is a fork of [semantic-release-helm](https://github.com/m1pl/semantic-release-helm) with added support
> for [ChartMuseum](https://github.com/helm/chartmuseum) repositories such as [Harbor](https://goharbor.io/) by utilizing
> the [helm cm-push](https://github.com/chartmuseum/helm-push) plugin. It also supports helm versions >=3.7.0 and pre-release branches.

This is a plugin for _semantic-release_. It updates `version` and `appVersion` of a [Helm](https://helm.sh/) chart's
_Chart.yaml_.

The `version` and `appVersion` are updated according to `nextRelease.version`.
Updating the `appVersion` is optional and can be disabled by setting `onlyUpdateVersion` to `true`.

## Install

```bash
npm install semantic-release-helm3 -D
```

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

### Plugin Config

| Parameter           | Type      | Default | Required | Description                                                                                                                           |
| ------------------- | --------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `chartPath`         | `string`  | `""`    | `true`   | Chart directory, where the _Chart.yaml_ is located.                                                                                   |
| `registry`          | `string`  | `""`    | `false`  | URI of a container registry.                                                                                                          |
| `onlyUpdateVersion` | `boolean` | `false` | `false`  | Don't change `appVersion` if this is true. Useful if your chart is in a different git repo than the application.                      |
| `crPublish`         | `boolean` | `false` | `false`  | Enable chart-releaser publishing.                                                                                                     |
| `crConfigPath`      | `string`  | `""`    | `false`  | Path to .ct.yaml chart-releaser configuration file.                                                                                   |
| `isChartMuseum`     | `boolean` | `false` | `false`  | Enable ChartMuseum publishing.                                                                                                        |
| `populateChangelog` | `boolean` | `false` | `false`  | Populate `artifacthub.io/changes` annotations with notes produced by `@semantic-release/release-notes-generator` compatible plugins.  |
| `packageArgs`       | `string`  | `""`    | `false`  | Additional parameters for the helm package command, e.g. `--key mykey --keyring ~/.gnupg/secring.gpg`                                 |
| `cmPushArgs`        | `string`  | `""`    | `false`  | Additional parameters for the helm cm-push command (only relevant if `isChartMuseum` is set to true) e.g. `--context-path /repo/path` |
| `skipRegistryLogin`        | `boolean`  | `""`    | `false`  | Additional parameter to skip the `helm registry login` in the verifyConditions step |


### Environment Variables

Pass credentials through environment variables accordingly:

```
export REGISTRY_HOST=<HOST>
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
      "semantic-release-helm3",
      {
        chartPath: './chart',
        registry: 'localhost:5000/repo/chart'
      }
    ]
  ]
}
```

## ChartMuseum Example

The [helm cm-push](https://github.com/chartmuseum/helm-push) plugin adds support for [ChartMuseum](https://github.com/helm/chartmuseum)
repositories such as [Harbor](https://github.com/goharbor/harbor).

This will push the chart to the specified repository, e.g. `https://mydomain.com/chartrepo/myproject` and
tag the chart with the value of `version` from _Chart.yaml_.

It is important to set `isChartMuseum` to `true` and to specify the repository url as `registry`.

**Note:** It is required to have at least helm version `3.7.0` installed.

```
{
  "plugins": [
    [
      "semantic-release-helm3",
      {
        chartPath: './chart',
        registry: 'https://mydomain.com/chartrepo/myproject',
        isChartMuseum: true
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
      "semantic-release-helm3",
      {
        chartPath: './chart',
        registry: 's3://my-s3-bucket-repo/s3-prefix',
        onlyUpdateVersion: true,
      }
    ]
  ]
}
```

[license]: https://github.com/nflaig/semantic-release-helm/blob/master/LICENSE
[npm-package]: https://www.npmjs.com/package/semantic-release-helm3
[npm-version-badge]: https://img.shields.io/npm/v/semantic-release-helm3.svg?style=flat-square
[npm-downloads-badge]: https://img.shields.io/npm/dw/semantic-release-helm3.svg?label=Downloads&style=flat-square&color=blue
[npm-total-downloads-badge]: https://img.shields.io/npm/dt/semantic-release-helm3.svg?label=Total%20Downloads&style=flat-square&color=blue
[license-badge]: https://img.shields.io/github/license/nflaig/semantic-release-helm.svg?color=blue&label=License&style=flat-square
