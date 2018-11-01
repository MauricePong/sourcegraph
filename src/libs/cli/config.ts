import * as OmniCLI from 'omnicli'

import { upsertSourcegraphUrl, URLError } from '../../browser/helpers/storage'
import storage from '../../browser/storage'

const upserUrl = (command: string) => ([url]: string[]) => {
    const err = upsertSourcegraphUrl(url)
    if (!err) {
        return
    }

    if (err === URLError.Empty || err === URLError.Invalid) {
        console.error(`src :${command} - invalid url entered`)
    } else if (err === URLError.HTTPNotSupported) {
        console.error(
            'Safari extensions do not support communication via `http:`. We suggest using https://ngrok.io for local testing.'
        )
    }
}

const addUrlCommand: OmniCLI.Command = {
    name: 'add-url',
    action: upserUrl('add-url'),
    description: 'Add a Sourcegraph URL',
}

function getSetURLSuggestions([cmd, ...args]: string[]): Promise<OmniCLI.Suggestion[]> {
    return new Promise(resolve => {
        storage.getSync(({ sourcegraphURL, serverUrls }) => {
            const suggestions: OmniCLI.Suggestion[] = serverUrls.map(url => ({
                content: url,
                description: `${url}${url === sourcegraphURL ? ' (current)' : ''}`,
            }))

            resolve(suggestions)
        })
    })
}

const setUrlCommand: OmniCLI.Command = {
    name: 'set-url',
    action: upserUrl('set-url'),
    getSuggestions: getSetURLSuggestions,
    description: 'Set your primary Sourcegraph URL',
}

function setOpenFileOn([to]: string[]): void {
    if ((to && to === 'true') || to === 'false') {
        storage.setSync({
            openFileOnSourcegraph: to === 'true',
        })
        return
    }

    storage.getSync(({ openFileOnSourcegraph }) => storage.setSync({ openFileOnSourcegraph: !openFileOnSourcegraph }))
}

function getSetOpenFileOnSuggestions(): Promise<OmniCLI.Suggestion[]> {
    return new Promise(resolve => {
        storage.getSync(({ openFileOnSourcegraph }) =>
            resolve([
                {
                    content: openFileOnSourcegraph ? 'false' : 'true',
                    description: `Open files from the fuzzy finder on ${
                        openFileOnSourcegraph ? 'your code host' : 'Sourcegraph'
                    }`,
                },
            ])
        )
    })
}

const setOpenFileOnCommand: OmniCLI.Command = {
    name: 'set-open-on-sg',
    alias: ['sof'],
    action: setOpenFileOn,
    getSuggestions: getSetOpenFileOnSuggestions,
    description: `Set whether you would like files to open on Sourcegraph of the given repo's code host`,
}

export default [addUrlCommand, setUrlCommand, setOpenFileOnCommand]
