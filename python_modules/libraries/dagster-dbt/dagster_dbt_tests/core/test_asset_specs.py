from typing import Any, Dict

from dagster import Definitions, external_assets_from_specs
from dagster_dbt.asset_specs import build_dbt_asset_specs


def test_build_dbt_asset_specs_as_external_assets(
    test_jaffle_shop_manifest: Dict[str, Any],
) -> None:
    assert Definitions(
        assets=[
            *external_assets_from_specs(
                build_dbt_asset_specs(
                    manifest=test_jaffle_shop_manifest,
                )
            )
        ]
    )
