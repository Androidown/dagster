/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type {TextChanges} from '@typefox/monaco-editor-react';
import {MonacoEditorReactComp} from '@typefox/monaco-editor-react';
import {MonacoEditorLanguageClientWrapper, UserConfig} from 'monaco-editor-wrapper';
import {StrictMode} from 'react';

import '@codingame/monaco-vscode-python-default-extension';

const createUserConfig = (): UserConfig => {
  return {
    languageClientConfig: {
      languageId: 'python',
      name: 'Python Language Server Example',
      options: {
        $type: 'WebSocket',
        host: 'localhost',
        port: 8989,
        // path: "pyright",
        extraParams: {
          authorization: 'UserAuth',
        },
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
            text: '',
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

export default function CodeEditor() {
  const onTextChanged = (textChanges: TextChanges) => {
    console.log(
      `Dirty? ${textChanges.isDirty}\ntext: ${textChanges.main}\ntextOriginal: ${textChanges.original}`,
    );
  };

  return (
    <StrictMode>
      <MonacoEditorReactComp
        userConfig={createUserConfig()}
        style={{
          paddingTop: '5px',
          height: '80vh',
        }}
        onTextChanged={onTextChanged}
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
