import asyncio
import functools
import inspect
import itertools
import json
from typing import Any, List, Optional, Union, Dict
from typing import Callable

import cattrs
from jedi import Project
from jedi.api.refactoring import RefactoringError
from loguru import logger
from lsprotocol.types import (
    COMPLETION_ITEM_RESOLVE,
    INITIALIZE,
    TEXT_DOCUMENT_CODE_ACTION,
    TEXT_DOCUMENT_COMPLETION,
    TEXT_DOCUMENT_DECLARATION,
    TEXT_DOCUMENT_DEFINITION,
    TEXT_DOCUMENT_DID_CHANGE,
    TEXT_DOCUMENT_DID_CLOSE,
    TEXT_DOCUMENT_DID_OPEN,
    TEXT_DOCUMENT_DID_SAVE,
    TEXT_DOCUMENT_DOCUMENT_HIGHLIGHT,
    TEXT_DOCUMENT_DOCUMENT_SYMBOL,
    TEXT_DOCUMENT_HOVER,
    TEXT_DOCUMENT_REFERENCES,
    TEXT_DOCUMENT_RENAME,
    TEXT_DOCUMENT_SIGNATURE_HELP,
    TEXT_DOCUMENT_TYPE_DEFINITION,
    WORKSPACE_DID_CHANGE_CONFIGURATION,
    WORKSPACE_SYMBOL,
    CodeAction,
    CodeActionKind,
    CodeActionOptions,
    CodeActionParams,
    CompletionItem,
    CompletionList,
    CompletionOptions,
    CompletionParams,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    DidOpenTextDocumentParams,
    DidSaveTextDocumentParams,
    DocumentHighlight,
    DocumentSymbol,
    DocumentSymbolParams,
    Hover,
    InitializeParams,
    InitializeResult,
    Location,
    MarkupContent,
    MarkupKind,
    MessageType,
    ParameterInformation,
    RenameParams,
    SignatureHelp,
    SignatureHelpOptions,
    SignatureInformation,
    SymbolInformation,
    TextDocumentPositionParams,
    WorkspaceEdit,
    WorkspaceSymbolParams,
)
from pygls.capabilities import get_capability
from pygls.protocol import LanguageServerProtocol, lsp_method
from pygls.server import LanguageServer
from starlette.websockets import WebSocket

from . import jedi_utils, pygls_utils, text_edit_utils
from .initialization_options import (
    InitializationOptions,
    initialization_options_converter,
)


class JediLanguageServerProtocol(LanguageServerProtocol):
    """Override some built-in functions."""

    _server: "JediServer"

    @lsp_method(INITIALIZE)
    def lsp_initialize(self, params: InitializeParams) -> InitializeResult:
        server = self._server
        try:
            server.initialization_options = (
                initialization_options_converter.structure(
                    {}
                    if params.initialization_options is None
                    else params.initialization_options,
                    InitializationOptions,
                )
            )
        except cattrs.BaseValidationError as error:
            msg = (
                "Invalid InitializationOptions, using defaults:"
                f" {cattrs.transform_error(error)}"
            )
            server.show_message(msg, msg_type=MessageType.Error)
            server.show_message_log(msg, msg_type=MessageType.Error)
            server.initialization_options = InitializationOptions()

        initialization_options = server.initialization_options
        jedi_utils.set_jedi_settings(initialization_options)

        initialize_result: InitializeResult = super().lsp_initialize(params)
        workspace_options = initialization_options.workspace
        server.project = (
            Project(
                path=server.workspace.root_path,
                environment_path=workspace_options.environment_path,
                added_sys_path=workspace_options.extra_paths,
                smart_sys_path=True,
                load_unsafe_extensions=False,
            )
            if server.workspace.root_path
            else None
        )
        return initialize_result


class WebSocketTransportAdapter:
    def __init__(self, ws: WebSocket, loop):
        self._ws = ws
        self._loop = loop

    def close(self) -> None:
        """Stop the WebSocket server."""
        self._loop.create_task(self._ws.close())

    def write(self, data) -> None:
        """Create a task to write specified data into a WebSocket."""
        if isinstance(data, bytes):
            data = data.decode()
        logger.info(f'read msg: {data}')
        asyncio.ensure_future(self._ws.send_text(data), loop=self._loop)


class JediServer(LanguageServer):
    _features = {}
    _commands = {}
    initialization_options: InitializationOptions
    project: Optional[Project]
    namespaces: Optional[List[Dict]]

    def __init__(
        self,
        name: str,
        version: str,
        websocket: WebSocket,
        namespaces: List[Dict],
        loop=None,
        **kwargs,
    ):
        super().__init__(name, version, loop, **kwargs)
        self.websocket = websocket
        for payload in self._features.values():
            self.lsp.fm.feature(*payload[1:])(payload[0])
        for payload in self._commands.values():
            self.lsp.fm.command(*payload[1:])(payload[0])
        self.namespaces = namespaces

    @classmethod
    def feature(
        cls,
        feature_name: str,
        options: Optional[Any] = None,
    ) -> Callable:
        """Decorator used to register LSP features.

        Example
        -------
        ::

           @ls.feature('textDocument/completion', CompletionOptions(trigger_characters=['.']))
           def completions(ls, params: CompletionParams):
               return CompletionList(is_incomplete=False, items=[CompletionItem("Completion 1")])
        """

        def deco(func):
            if inspect.iscoroutinefunction(func):
                @functools.wraps(func)
                async def wrapper(*args, **kwargs):
                    return await func(*args, **kwargs)
            else:
                @functools.wraps(func)
                def wrapper(*args, **kwargs):
                    return func(*args, **kwargs)
            cls._features[feature_name] = (wrapper, feature_name, options)
            return wrapper

        return deco

    @classmethod
    def command(cls, command_name: str) -> Callable:
        """Decorator used to register custom commands.

        Example
        -------
        ::

           @ls.command('myCustomCommand')
           def my_cmd(ls, a, b, c):
               pass
        """

        def deco(func):
            if inspect.iscoroutinefunction(func):
                async def wrapper(*args, **kwargs):
                    return await func(*args, **kwargs)
            else:
                def wrapper(*args, **kwargs):
                    return func(*args, **kwargs)
            cls._commands[command_name] = (wrapper, command_name)
            return wrapper

        return deco

    async def start_serve(self):
        sock = self.websocket
        self.lsp._send_only_body = True
        self.lsp.transport = WebSocketTransportAdapter(sock, self.loop)
        while True:
            msg = await sock.receive_text()
            logger.info(f'read msg: {msg}')
            self.lsp._procedure_handler(
                json.loads(msg, object_hook=self.lsp._deserialize_message)
            )


# JediServer capabilities
@JediServer.feature(COMPLETION_ITEM_RESOLVE)
def completion_item_resolve(
    server: JediServer, params: CompletionItem
) -> CompletionItem:
    """Resolves documentation and detail of given completion item."""
    markup_kind = _choose_markup(server)
    return jedi_utils.lsp_completion_item_resolve(
        params, markup_kind=markup_kind
    )


@JediServer.feature(
    TEXT_DOCUMENT_COMPLETION,
    CompletionOptions(
        trigger_characters=[".", "'", '"'], resolve_provider=True
    ),
)
def completion(
    server: JediServer, params: CompletionParams
) -> Optional[CompletionList]:
    """Returns completion items."""
    snippet_disable = server.initialization_options.completion.disable_snippets
    resolve_eagerly = server.initialization_options.completion.resolve_eagerly
    ignore_patterns = server.initialization_options.completion.ignore_patterns
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    completions_jedi_raw = jedi_script.complete(*jedi_lines)
    if not ignore_patterns:
        # A performance optimization. ignore_patterns should usually be empty;
        # this special case avoid repeated filter checks for the usual case.
        completions_jedi = (comp for comp in completions_jedi_raw)
    else:
        completions_jedi = (
            comp
            for comp in completions_jedi_raw
            if not any(i.match(comp.name) for i in ignore_patterns)
        )
    snippet_support = get_capability(
        server.client_capabilities,
        "text_document.completion.completion_item.snippet_support",
        False,
    )
    markup_kind = _choose_markup(server)
    is_import_context = jedi_utils.is_import(
        script_=jedi_script,
        line=jedi_lines[0],
        column=jedi_lines[1],
    )
    enable_snippets = (
        snippet_support and not snippet_disable and not is_import_context
    )
    char_before_cursor = pygls_utils.char_before_cursor(
        document=server.workspace.get_text_document(params.text_document.uri),
        position=params.position,
    )
    jedi_utils.clear_completions_cache()
    # number of characters in the string representation of the total number of
    # completions returned by jedi.
    total_completion_chars = len(str(len(completions_jedi_raw)))
    completion_items = [
        jedi_utils.lsp_completion_item(
            completion=completion,
            char_before_cursor=char_before_cursor,
            enable_snippets=enable_snippets,
            resolve_eagerly=resolve_eagerly,
            markup_kind=markup_kind,
            sort_append_text=str(count).zfill(total_completion_chars),
        )
        for count, completion in enumerate(completions_jedi)
    ]
    return (
        CompletionList(is_incomplete=False, items=completion_items)
        if completion_items
        else None
    )


@JediServer.feature(
    TEXT_DOCUMENT_SIGNATURE_HELP,
    SignatureHelpOptions(trigger_characters=["(", ","]),
)
def signature_help(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[SignatureHelp]:
    """Returns signature help.

    Note: for docstring, we currently choose plaintext because coc doesn't
    handle markdown well in the signature. Will update if this changes in the
    future.
    """
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    signatures_jedi = jedi_script.get_signatures(*jedi_lines)
    markup_kind = _choose_markup(server)
    signatures = [
        SignatureInformation(
            label=jedi_utils.signature_string(signature),
            documentation=MarkupContent(
                kind=markup_kind,
                value=jedi_utils.convert_docstring(
                    signature.docstring(raw=True),
                    markup_kind,
                ),
            ),
            parameters=[
                ParameterInformation(label=info.to_string())
                for info in signature.params
            ],
        )
        for signature in signatures_jedi
    ]
    return (
        SignatureHelp(
            signatures=signatures,
            active_signature=0,
            active_parameter=(
                signatures_jedi[0].index if signatures_jedi else 0
            ),
        )
        if signatures
        else None
    )


@JediServer.feature(TEXT_DOCUMENT_DECLARATION)
def declaration(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[List[Location]]:
    """Support Goto Declaration."""
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    names = jedi_script.goto(*jedi_lines)
    definitions = [
        definition
        for definition in (jedi_utils.lsp_location(name) for name in names)
        if definition is not None
    ]
    return definitions if definitions else None


@JediServer.feature(TEXT_DOCUMENT_DEFINITION)
def definition(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[List[Location]]:
    """Support Goto Definition."""
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    names = jedi_script.goto(
        *jedi_lines,
        follow_imports=True,
        follow_builtin_imports=True,
    )
    definitions = [
        definition
        for definition in (jedi_utils.lsp_location(name) for name in names)
        if definition is not None
    ]
    return definitions if definitions else None


@JediServer.feature(TEXT_DOCUMENT_TYPE_DEFINITION)
def type_definition(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[List[Location]]:
    """Support Goto Type Definition."""
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    names = jedi_script.infer(*jedi_lines)
    definitions = [
        definition
        for definition in (jedi_utils.lsp_location(name) for name in names)
        if definition is not None
    ]
    return definitions if definitions else None


@JediServer.feature(TEXT_DOCUMENT_DOCUMENT_HIGHLIGHT)
def highlight(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[List[DocumentHighlight]]:
    """Support document highlight request.

    This function is called frequently, so we minimize the number of expensive
    calls. These calls are:

    1. Getting assignment of current symbol (script.goto)
    2. Getting all names in the current script (script.get_names)

    Finally, we only return names if there are more than 1. Otherwise, we don't
    want to highlight anything.
    """
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    names = jedi_script.get_references(*jedi_lines, scope="file")
    lsp_ranges = [jedi_utils.lsp_range(name) for name in names]
    highlight_names = [
        DocumentHighlight(range=lsp_range)
        for lsp_range in lsp_ranges
        if lsp_range
    ]
    return highlight_names if highlight_names else None


@JediServer.feature(TEXT_DOCUMENT_HOVER)
def hover(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[Hover]:
    """Support Hover."""
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    markup_kind = _choose_markup(server)
    hover_text = jedi_utils.hover_text(
        jedi_script.help(*jedi_lines),
        markup_kind,
        server.initialization_options,
    )
    if not hover_text:
        return None
    contents = MarkupContent(kind=markup_kind, value=hover_text)
    _range = pygls_utils.current_word_range(document, params.position)
    return Hover(contents=contents, range=_range)


@JediServer.feature(TEXT_DOCUMENT_REFERENCES)
def references(
    server: JediServer, params: TextDocumentPositionParams
) -> Optional[List[Location]]:
    """Obtain all references to text."""
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    names = jedi_script.get_references(*jedi_lines)
    locations = [
        location
        for location in (jedi_utils.lsp_location(name) for name in names)
        if location is not None
    ]
    return locations if locations else None


@JediServer.feature(TEXT_DOCUMENT_DOCUMENT_SYMBOL)
def document_symbol(
    server: JediServer, params: DocumentSymbolParams
) -> Optional[Union[List[DocumentSymbol], List[SymbolInformation]]]:
    """Document Python document symbols, hierarchically if possible.

    In Jedi, valid values for `name.type` are:

    - `module`
    - `class`
    - `instance`
    - `function`
    - `param`
    - `path`
    - `keyword`
    - `statement`

    We do some cleaning here. For hierarchical symbols, names from scopes that
    aren't directly accessible with dot notation are removed from display. For
    non-hierarchical symbols, we simply remove `param` symbols. Others are
    included for completeness.
    """
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    names = jedi_script.get_names(all_scopes=True, definitions=True)
    if get_capability(
        server.client_capabilities,
        "text_document.document_symbol.hierarchical_document_symbol_support",
        False,
    ):
        document_symbols = jedi_utils.lsp_document_symbols(names)
        return document_symbols if document_symbols else None

    symbol_information = [
        symbol_info
        for symbol_info in (
            jedi_utils.lsp_symbol_information(name)
            for name in names
            if name.type != "param"
        )
        if symbol_info is not None
    ]
    return symbol_information if symbol_information else None


def _ignore_folder(path_check: str, jedi_ignore_folders: List[str]) -> bool:
    """Determines whether there's an ignore folder in the path.

    Intended to be used with the `workspace_symbol` function
    """
    for ignore_folder in jedi_ignore_folders:
        if f"/{ignore_folder}/" in path_check:
            return True
    return False


@JediServer.feature(WORKSPACE_SYMBOL)
def workspace_symbol(
    server: JediServer, params: WorkspaceSymbolParams
) -> Optional[List[SymbolInformation]]:
    """Document Python workspace symbols.

    Returns up to maxSymbols, or all symbols if maxSymbols is <= 0, ignoring
    the following symbols:

    1. Those that don't have a module_path associated with them (built-ins)
    2. Those that are not rooted in the current workspace.
    3. Those whose folders contain a directory that is ignored (.venv, etc)
    """
    if not server.project:
        return None
    names = server.project.complete_search(params.query)
    workspace_root = server.workspace.root_path
    ignore_folders = (
        server.initialization_options.workspace.symbols.ignore_folders
    )
    unignored_names = (
        name
        for name in names
        if name.module_path is not None
           and str(name.module_path).startswith(workspace_root)
           and not _ignore_folder(str(name.module_path), ignore_folders)
    )
    _symbols = (
        symbol
        for symbol in (
        jedi_utils.lsp_symbol_information(name) for name in unignored_names
    )
        if symbol is not None
    )
    max_symbols = server.initialization_options.workspace.symbols.max_symbols
    symbols = (
        list(itertools.islice(_symbols, max_symbols))
        if max_symbols > 0
        else list(_symbols)
    )
    return symbols if symbols else None


@JediServer.feature(TEXT_DOCUMENT_RENAME)
def rename(
    server: JediServer, params: RenameParams
) -> Optional[WorkspaceEdit]:
    """Rename a symbol across a workspace."""
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    jedi_lines = jedi_utils.line_column(params.position)
    try:
        refactoring = jedi_script.rename(*jedi_lines, new_name=params.new_name)
    except RefactoringError:
        return None
    changes = text_edit_utils.lsp_document_changes(
        server.workspace, refactoring
    )
    return WorkspaceEdit(document_changes=changes) if changes else None


@JediServer.feature(
    TEXT_DOCUMENT_CODE_ACTION,
    CodeActionOptions(
        code_action_kinds=[
            CodeActionKind.RefactorInline,
            CodeActionKind.RefactorExtract,
        ],
    ),
)
def code_action(
    server: JediServer, params: CodeActionParams
) -> Optional[List[CodeAction]]:
    """Get code actions.

    Currently supports:
        1. Inline variable
        2. Extract variable
        3. Extract function
    """
    document = server.workspace.get_text_document(params.text_document.uri)
    jedi_script = jedi_utils.interpreter(server, document)
    code_actions = []
    jedi_lines = jedi_utils.line_column(params.range.start)
    jedi_lines_extract = jedi_utils.line_column_range(params.range)

    try:
        if params.range.start.line != params.range.end.line:
            # refactor this at some point; control flow with exception == bad
            raise RefactoringError("inline only viable for single-line range")
        inline_refactoring = jedi_script.inline(*jedi_lines)
    except (RefactoringError, AttributeError, IndexError):
        inline_changes = []
    else:
        inline_changes = text_edit_utils.lsp_document_changes(
            server.workspace, inline_refactoring
        )
    if inline_changes:
        code_actions.append(
            CodeAction(
                title="Inline variable",
                kind=CodeActionKind.RefactorInline,
                edit=WorkspaceEdit(
                    document_changes=inline_changes,
                ),
            )
        )

    extract_var = (
        server.initialization_options.code_action.name_extract_variable
    )
    try:
        extract_variable_refactoring = jedi_script.extract_variable(
            new_name=extract_var, **jedi_lines_extract
        )
    except (RefactoringError, AttributeError, IndexError):
        extract_variable_changes = []
    else:
        extract_variable_changes = text_edit_utils.lsp_document_changes(
            server.workspace, extract_variable_refactoring
        )
    if extract_variable_changes:
        code_actions.append(
            CodeAction(
                title=f"Extract expression into variable '{extract_var}'",
                kind=CodeActionKind.RefactorExtract,
                edit=WorkspaceEdit(
                    document_changes=extract_variable_changes,
                ),
            )
        )

    extract_func = (
        server.initialization_options.code_action.name_extract_function
    )
    try:
        extract_function_refactoring = jedi_script.extract_function(
            new_name=extract_func, **jedi_lines_extract
        )
    except (RefactoringError, AttributeError, IndexError):
        extract_function_changes = []
    else:
        extract_function_changes = text_edit_utils.lsp_document_changes(
            server.workspace, extract_function_refactoring
        )
    if extract_function_changes:
        code_actions.append(
            CodeAction(
                title=f"Extract expression into function '{extract_func}'",
                kind=CodeActionKind.RefactorExtract,
                edit=WorkspaceEdit(
                    document_changes=extract_function_changes,
                ),
            )
        )

    return code_actions if code_actions else None


@JediServer.feature(WORKSPACE_DID_CHANGE_CONFIGURATION)
def did_change_configuration(
    server: JediServer,
    params: DidChangeConfigurationParams,
) -> None:
    """Implement event for workspace/didChangeConfiguration.

    Currently does nothing, but necessary for pygls. See::
        <https://github.com/pappasam/jedi-language-server/issues/58>
    """


# Static capability or initializeOptions functions that rely on a specific
# client capability or user configuration. These are associated with
# JediServer within JediLanguageServerProtocol.lsp_initialize
@jedi_utils.debounce(1, keyed_by="uri")
def _publish_diagnostics(server: JediServer, uri: str) -> None:
    """Helper function to publish diagnostics for a file."""
    # The debounce decorator delays the execution by 1 second
    # canceling notifications that happen in that interval.
    # Since this function is executed after a delay, we need to check
    # whether the document still exists
    if uri not in server.workspace.documents:
        return

    doc = server.workspace.get_text_document(uri)
    diagnostic = jedi_utils.lsp_python_diagnostic(uri, doc.source)
    diagnostics = [diagnostic] if diagnostic else []

    server.publish_diagnostics(uri, diagnostics)


@JediServer.feature(TEXT_DOCUMENT_DID_SAVE)
def did_save_diagnostics(
    server: JediServer, params: DidSaveTextDocumentParams
) -> None:
    """Actions run on textDocument/didSave: diagnostics."""
    _publish_diagnostics(server, params.text_document.uri)


@JediServer.feature(TEXT_DOCUMENT_DID_CHANGE)
def did_change_diagnostics(
    server: JediServer, params: DidChangeTextDocumentParams
) -> None:
    """Actions run on textDocument/didChange: diagnostics."""
    _publish_diagnostics(server, params.text_document.uri)


@JediServer.feature(TEXT_DOCUMENT_DID_OPEN)
def did_open_diagnostics(
    server: JediServer, params: DidOpenTextDocumentParams
) -> None:
    """Actions run on textDocument/didOpen: diagnostics."""
    _publish_diagnostics(server, params.text_document.uri)


@JediServer.feature(TEXT_DOCUMENT_DID_CLOSE)
def did_close_diagnostics(
    server: JediServer, params: DidCloseTextDocumentParams
) -> None:
    """Actions run on textDocument/didClose: diagnostics."""
    server.publish_diagnostics(params.text_document.uri, [])


def _choose_markup(server: JediServer) -> MarkupKind:
    """Returns the preferred or first of supported markup kinds."""
    markup_preferred = server.initialization_options.markup_kind_preferred
    markup_supported = get_capability(
        server.client_capabilities,
        "text_document.completion.completion_item.documentation_format",
        [MarkupKind.PlainText],
    )

    return MarkupKind(
        markup_preferred
        if markup_preferred in markup_supported
        else markup_supported[0]
    )


def get_server(websocket, namespaces=None):
    return JediServer(
        "lsp-server", "v0.1", websocket,
        loop=asyncio.get_running_loop(),
        protocol_cls=JediLanguageServerProtocol,
        namespaces=namespaces or []
    )