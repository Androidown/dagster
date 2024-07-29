/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type {TextChanges} from '@typefox/monaco-editor-react';
import {MonacoEditorReactComp} from '@typefox/monaco-editor-react';
import {MonacoEditorLanguageClientWrapper, UserConfig} from 'monaco-editor-wrapper';
import {StrictMode} from 'react';

import '@codingame/monaco-vscode-python-default-extension';

const createUserConfig = (code: string): UserConfig => {
  let backendUrl = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "localhost:8000";
  if (backendUrl.toLowerCase().startsWith("http://")) {
    backendUrl = backendUrl.slice("http://".length)
  } else if (backendUrl.toLowerCase().startsWith("https://")) {
    backendUrl = backendUrl.slice("https://".length)
  }

  let [host, port] = backendUrl.split(":");
  if (host === undefined) { host = "localhost" }
  if (port === undefined) { port = "8000" }

  return {
    languageClientConfig: {
      languageId: 'python',
      name: 'Python Language Server Example',
      options: {
        $type: 'WebSocket',
        host: host,
        port: Number.parseInt(port),
        path: 'lsp',
        secured: false,
      },
      clientOptions: {
        documentSelector: ['python'],
      },
    },
    wrapperConfig: {
      editorAppConfig: {
        $type: 'extended',
        codeResources: {
          main: {
            text: code ?? '',
            fileExt: 'py',
          },
        },
        userConfiguration: {
          json: JSON.stringify({
            'workbench.colorTheme': 'Default Dark Modern',
            'editor.guides.bracketPairsHorizontal': 'active',
            'editor.wordBasedSuggestions': 'off',
          }),
        },
        useDiffEditor: false,
      },
    },
    loggerConfig: {
      enabled: true,
      debugEnabled: true,
    },
  };
};

interface Props {
  code: string;
  onTextChange: (textChanges: TextChanges) => void;
}

export function CodeEditor({code, onTextChange}: Props) {
  return (
    <StrictMode>
      <MonacoEditorReactComp
        userConfig={createUserConfig(code)}
        style={{
          paddingTop: '5px',
          height: '80vh',
        }}
        onTextChanged={onTextChange}
        onLoad={(wrapper: MonacoEditorLanguageClientWrapper) => {
          console.log(`Loaded ${wrapper.reportStatus().join('\n').toString()}`);
        }}
        onError={(e) => {
          console.error(e);
        }}
      />
    </StrictMode>
  );
}
