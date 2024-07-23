from .asset_decorator import dbt_assets as dbt_assets
from .asset_specs import build_dbt_asset_specs as build_dbt_asset_specs
from .asset_utils import (
    build_dbt_asset_selection as build_dbt_asset_selection,
    build_schedule_from_dbt_selection as build_schedule_from_dbt_selection,
    default_group_from_dbt_resource_props as default_group_from_dbt_resource_props,
    default_metadata_from_dbt_resource_props as default_metadata_from_dbt_resource_props,
    get_asset_key_for_model as get_asset_key_for_model,
    get_asset_key_for_source as get_asset_key_for_source,
    get_asset_keys_by_output_name_for_source as get_asset_keys_by_output_name_for_source,
    group_from_dbt_resource_props_fallback_to_directory as group_from_dbt_resource_props_fallback_to_directory,
)
from .cloud import (
    DbtCloudClientResource as DbtCloudClientResource,
    DbtCloudOutput as DbtCloudOutput,
    DbtCloudResource as DbtCloudResource,
    dbt_cloud_resource as dbt_cloud_resource,
    dbt_cloud_run_op as dbt_cloud_run_op,
    load_assets_from_dbt_cloud_job as load_assets_from_dbt_cloud_job,
)
from .core.resource import (
    DbtCliEventMessage as DbtCliEventMessage,
    DbtCliInvocation as DbtCliInvocation,
    DbtCliResource as DbtCliResource,
)
from .dagster_dbt_translator import (
    DagsterDbtTranslator as DagsterDbtTranslator,
    DagsterDbtTranslatorSettings as DagsterDbtTranslatorSettings,
    KeyPrefixDagsterDbtTranslator as KeyPrefixDagsterDbtTranslator,
)
from .dbt_manifest_asset_selection import DbtManifestAssetSelection as DbtManifestAssetSelection
from .dbt_project import (
    DagsterDbtProjectPreparer as DagsterDbtProjectPreparer,
    DbtProject as DbtProject,
    DbtProjectPreparer as DbtProjectPreparer,
)
from .errors import (
    DagsterDbtCliRuntimeError as DagsterDbtCliRuntimeError,
    DagsterDbtCloudJobInvariantViolationError as DagsterDbtCloudJobInvariantViolationError,
    DagsterDbtError as DagsterDbtError,
)
from .freshness_builder import (
    build_freshness_checks_from_dbt_assets as build_freshness_checks_from_dbt_assets,
)
from .version import __version__ as __version__

# isort: split

# ########################
# ##### DYNAMIC IMPORTS
# ########################
import importlib
from typing import Any, Mapping, Sequence, Tuple

from dagster._annotations import deprecated
from dagster._core.libraries import DagsterLibraryRegistry
from dagster._utils.warnings import deprecation_warning
from typing_extensions import Final

DagsterLibraryRegistry.register("dagster-dbt", __version__)


_DEPRECATED: Final[Mapping[str, Tuple[str, str, str]]] = {
    ##### EXAMPLE
    # "Foo": (
    #     "dagster.some.module",
    #     "1.1.0",  # breaking version
    #     "Use Bar instead.",
    # ),
}

_DEPRECATED_WARNING: Final[Mapping[str, Tuple[str, str, str]]] = {
    ##### EXAMPLE
    # "Foo": (
    #     "dagster.some.module",
    #     "1.1.0",  # breaking version
    #     "Use Bar instead.",
    # ),
}


def __getattr__(name: str) -> Any:
    if name in _DEPRECATED:
        module, breaking_version, additional_warn_text = _DEPRECATED[name]

        value = deprecated(
            breaking_version=breaking_version, additional_warn_text=additional_warn_text
        )(getattr(importlib.import_module(module), name))

        return value
    elif name in _DEPRECATED_WARNING:
        module, breaking_version, additional_warn_text = _DEPRECATED_WARNING[name]

        if additional_warn_text:
            deprecation_warning(name, breaking_version, additional_warn_text)

        value = getattr(importlib.import_module(module), name)

        return value
    else:
        raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


def __dir__() -> Sequence[str]:
    return [*globals(), *_DEPRECATED.keys()]
