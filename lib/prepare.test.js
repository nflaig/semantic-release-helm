const fs = require('fs');
const mock = require('mock-fs');

const prepare = require('./prepare')

afterAll(() => {
    mock.restore();
});


let logger, env;
beforeEach(() => {
    logger = {
        log: jest.fn()
    }

    env = {
        CHART_PATH: './'
    };
    mock({
        './Chart.yaml': `
apiVersion: v2
# image: "felddy/foundryvtt"
appVersion: '11.308'
description: Foundry Virtual Tabletop
name: foundry-vtt
version: 1.4.0
annotations:
  artifacthub.io/images: |
    - name: foundryvtt
      image: "felddy/foundryvtt:10.291"
  artifacthub.io/changes: |2
     - oldchangelog
`
    })
});

it('comments are not stripped', async () => {
    await prepare({}, {nextRelease: {version: "1.2.3", notes: "changelog"}, logger, env});

    expect((await fs.promises.readFile('./Chart.yaml')).toString().trim()).toEqual(`
apiVersion: v2
# image: "felddy/foundryvtt"
appVersion: '1.2.3'
description: Foundry Virtual Tabletop
name: foundry-vtt
version: 1.2.3
annotations:
  artifacthub.io/images: |
    - name: foundryvtt
      image: "felddy/foundryvtt:10.291"
  artifacthub.io/changes: |2
     - oldchangelog
`.trim());
});

it('changelog is updated', async () => {
    await prepare({populateChangelog: true}, {nextRelease: {version: "1.2.3", notes: "- changelog"}, logger, env});

    expect((await fs.promises.readFile('./Chart.yaml')).toString().trim()).toEqual(`
apiVersion: v2
# image: "felddy/foundryvtt"
appVersion: '1.2.3'
description: Foundry Virtual Tabletop
name: foundry-vtt
version: 1.2.3
annotations:
  artifacthub.io/images: |
    - name: foundryvtt
      image: "felddy/foundryvtt:10.291"
  artifacthub.io/changes: |-
    - changelog
    `.trim());
});

it('dont update appVersion', async () => {
    await prepare({onlyUpdateVersion: true}, {nextRelease: {version: "1.2.3", notes: "changelog"}, logger, env});

    expect((await fs.promises.readFile('./Chart.yaml')).toString().trim()).toEqual(`
apiVersion: v2
# image: "felddy/foundryvtt"
appVersion: '11.308'
description: Foundry Virtual Tabletop
name: foundry-vtt
version: 1.2.3
annotations:
  artifacthub.io/images: |
    - name: foundryvtt
      image: "felddy/foundryvtt:10.291"
  artifacthub.io/changes: |2
     - oldchangelog
`.trim());
});

