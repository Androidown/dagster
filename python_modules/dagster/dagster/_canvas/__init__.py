from typing import Dict, List

import pydantic
from . import context, dispatch
from .steps import Step
from .codegen import Import


__all__ = [
    'convert_to_code',
]


def convert_to_code(data: List[Dict], namespace: List[str] = None) -> str:

    ctx = context.ContextLevel(
        None,
        None,
        namespace=namespace
    )
    context.Context(ctx)
    ctx.code_block.add_imports(
        Import(module='builtins'),
        Import(module='dagster', names=[
            'op',
            'Out',
            'Output',
            'AssetOut',
            'graph_multi_asset',
            'define_asset_job',
            'Nothing',
            'In',
        ]),
        # Import(module='builtins'),
    )

    for step in data:
        dispatch.compile(pydantic.parse_obj_as(Step, step), ctx=ctx)

    return ctx.code_block.generate()
