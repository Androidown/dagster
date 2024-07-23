from dagster import AutoMaterializePolicy, AutomationCondition, Definitions, asset
from dagster._core.remote_representation.external_data import external_repository_data_from_def
from dagster._serdes import serialize_value
from dagster._serdes.serdes import deserialize_value

from ..base_scenario import run_request
from ..scenario_specs import (
    daily_partitions_def,
    day_partition_key,
    one_asset,
    time_partitions_start_datetime,
)
from .automation_condition_scenario import AutomationConditionScenarioState


def test_missing_unpartitioned() -> None:
    state = AutomationConditionScenarioState(
        one_asset, automation_condition=AutomationCondition.missing()
    )

    state, result = state.evaluate("A")
    assert result.true_subset.size == 1
    original_value_hash = result.value_hash

    # still true
    state, result = state.evaluate("A")
    assert result.true_subset.size == 1
    assert result.value_hash == original_value_hash

    # after a run of A it's now False
    state, result = state.with_runs(run_request("A")).evaluate("A")
    assert result.true_subset.size == 0
    assert result.value_hash != original_value_hash

    # if we evaluate from scratch, it's also False
    _, result = state.without_cursor().evaluate("A")
    assert result.true_subset.size == 0


def test_missing_time_partitioned() -> None:
    state = (
        AutomationConditionScenarioState(
            one_asset, automation_condition=AutomationCondition.missing()
        )
        .with_asset_properties(partitions_def=daily_partitions_def)
        .with_current_time(time_partitions_start_datetime)
        .with_current_time_advanced(days=6, minutes=1)
    )

    state, result = state.evaluate("A")
    assert result.true_subset.size == 6

    # still true
    state, result = state.evaluate("A")
    assert result.true_subset.size == 6

    # after two runs of A those partitions are now False
    state, result = state.with_runs(
        run_request("A", day_partition_key(time_partitions_start_datetime, 1)),
        run_request("A", day_partition_key(time_partitions_start_datetime, 3)),
    ).evaluate("A")
    assert result.true_subset.size == 4

    # if we evaluate from scratch, they're still False
    _, result = state.without_cursor().evaluate("A")
    assert result.true_subset.size == 4


def test_serialize_definitions_with_asset_condition() -> None:
    amp = AutoMaterializePolicy.from_automation_condition(
        AutomationCondition.eager()
        & ~AutomationCondition.newly_updated().since(
            AutomationCondition.cron_tick_passed(cron_schedule="0 * * * *", cron_timezone="UTC")
        )
    )

    @asset(auto_materialize_policy=amp)
    def my_asset() -> int:
        return 0

    serialized = serialize_value(amp)
    assert isinstance(serialized, str)

    serialized = serialize_value(
        external_repository_data_from_def(Definitions(assets=[my_asset]).get_repository_def())
    )
    assert isinstance(serialized, str)


def test_deserialize_definitions_with_asset_condition() -> None:
    serialized = """{"__class__": "AutoMaterializePolicy", "asset_condition": {"__class__": "AndAssetCondition", "operands": [{"__class__": "RuleCondition", "rule": {"__class__": "MaterializeOnParentUpdatedRule", "updated_parent_filter": null}}, {"__class__": "NotAssetCondition", "operand": {"__class__": "NotAssetCondition", "operand": {"__class__": "RuleCondition", "rule": {"__class__": "MaterializeOnCronRule", "all_partitions": false, "cron_schedule": "0 * * * *", "timezone": "UTC"}}}}]}, "max_materializations_per_minute": null, "rules": {"__frozenset__": []}, "time_window_partition_scope_minutes": 1e-06}"""

    deserialized = deserialize_value(serialized, AutoMaterializePolicy)
    assert isinstance(deserialized, AutoMaterializePolicy)


def test_label_automation_condition() -> None:
    not_missing = (~AutomationCondition.missing()).with_label("Not missing")
    not_in_progress = (~AutomationCondition.in_progress()).with_label("Not in progress")
    not_missing_and_not_in_progress = (not_missing & not_in_progress).with_label("Blah")
    assert not_missing_and_not_in_progress.label == "Blah"
    assert not_missing_and_not_in_progress.get_snapshot("").label == "Blah"
    assert not_missing_and_not_in_progress.children[0].label == "Not missing"
    assert not_missing_and_not_in_progress.children[1].label == "Not in progress"
