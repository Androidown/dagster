# ruff: noqa: SLF001
import datetime
import os
import re
import subprocess
import tempfile

import pytest
import sqlalchemy as db
from dagster import (
    AssetKey,
    AssetMaterialization,
    AssetObservation,
    Output,
    job,
    op,
    reconstructable,
)
from dagster._core.definitions.data_version import DATA_VERSION_TAG
from dagster._core.errors import DagsterInvalidInvocationError
from dagster._core.execution.api import execute_job
from dagster._core.instance import DagsterInstance
from dagster._core.storage.event_log.migration import ASSET_KEY_INDEX_COLS
from dagster._core.storage.migration.bigint_migration import run_bigint_migration
from dagster._core.storage.sqlalchemy_compat import db_select
from dagster._core.storage.tags import PARTITION_NAME_TAG, PARTITION_SET_TAG
from dagster._daemon.types import DaemonHeartbeat
from dagster._utils import file_relative_path
from sqlalchemy import inspect


def get_columns(instance, table_name: str):
    with instance.run_storage.connect() as conn:
        return set(c["name"] for c in db.inspect(conn).get_columns(table_name))


def get_indexes(instance, table_name: str):
    with instance.run_storage.connect() as conn:
        return set(i["name"] for i in db.inspect(conn).get_indexes(table_name))


def get_primary_key(instance, table_name: str):
    constraint = inspect(instance.run_storage._engine).get_pk_constraint(table_name)
    if not constraint:
        return None
    return constraint.get("name")


def get_tables(instance):
    with instance.run_storage.connect() as conn:
        return db.inspect(conn).get_table_names()


def test_0_7_6_postgres_pre_add_pipeline_snapshot(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__, "snapshot_0_7_6_pre_add_pipeline_snapshot/postgres/pg_dump.txt"
        ),
    )

    run_id = "d5f89349-7477-4fab-913e-0925cef0a959"

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        @op
        def noop_op(_):
            pass

        @job
        def noop_job():
            noop_op()

        with pytest.raises(
            (db.exc.OperationalError, db.exc.ProgrammingError, db.exc.StatementError)
        ):
            noop_job.execute_in_process(instance=instance)

        # ensure migration is run
        instance.upgrade()

        runs = instance.get_runs()

        assert len(runs) == 1

        assert runs[0].run_id == run_id

        run = instance.get_run_by_id(run_id)

        assert run.run_id == run_id
        assert run.job_snapshot_id is None
        result = noop_job.execute_in_process(instance=instance)

        assert result.success

        runs = instance.get_runs()
        assert len(runs) == 2

        new_run_id = result.run_id

        new_run = instance.get_run_by_id(new_run_id)

        assert new_run.job_snapshot_id


def test_0_9_22_postgres_pre_asset_partition(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_9_22_pre_asset_partition/postgres/pg_dump.txt"),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        @op
        def asset_op(_):
            yield AssetMaterialization(
                asset_key=AssetKey(["path", "to", "asset"]), partition="partition_1"
            )
            yield Output(1)

        @job
        def asset_job():
            asset_op()

        with pytest.raises(
            (db.exc.OperationalError, db.exc.ProgrammingError, db.exc.StatementError)
        ):
            asset_job.execute_in_process(instance=instance)

        # ensure migration is run
        instance.upgrade()

        result = asset_job.execute_in_process(instance=instance)
        assert result.success


def test_0_9_22_postgres_pre_run_partition(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_9_22_pre_run_partition/postgres/pg_dump.txt"),
    )
    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        @op
        def simple_op(_):
            return 1

        @job
        def simple_job():
            simple_op()

        tags = {
            PARTITION_NAME_TAG: "my_partition",
            PARTITION_SET_TAG: "my_partition_set",
        }

        with pytest.raises(
            (db.exc.OperationalError, db.exc.ProgrammingError, db.exc.StatementError)
        ):
            simple_job.execute_in_process(tags=tags, instance=instance)

        # ensure migration is run
        instance.upgrade()

        result = simple_job.execute_in_process(tags=tags, instance=instance)
        assert result.success


def test_0_10_0_schedule_wipe(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_10_0_wipe_schedules/postgres/pg_dump.txt"),
    )
    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            instance.upgrade()

        with DagsterInstance.from_config(tempdir) as upgraded_instance:
            assert len(upgraded_instance.all_instigator_state()) == 0


def test_0_10_6_add_bulk_actions_table(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_10_6_add_bulk_actions_table/postgres/pg_dump.txt"),
    )
    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with pytest.raises(
            (db.exc.OperationalError, db.exc.ProgrammingError, db.exc.StatementError)
        ):
            with DagsterInstance.from_config(tempdir) as instance:
                instance.get_backfills()

        with DagsterInstance.from_config(tempdir) as instance:
            instance.upgrade()

        with DagsterInstance.from_config(tempdir) as upgraded_instance:
            assert len(upgraded_instance.get_backfills()) == 0


def test_0_11_0_add_asset_details(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_11_0_pre_asset_details/postgres/pg_dump.txt"),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            storage = instance._event_storage
            with pytest.raises(
                (
                    db.exc.OperationalError,
                    db.exc.ProgrammingError,
                    db.exc.StatementError,
                )
            ):
                storage.all_asset_keys()
            instance.upgrade()
            storage.all_asset_keys()


def test_0_12_0_add_mode_column(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_11_16_pre_add_mode_column/postgres/pg_dump.txt"),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        # Ensure that you don't get a migration required exception if not trying to use the
        # migration-required column.
        assert len(instance.get_runs()) == 1

        @op
        def basic():
            pass

        @job
        def noop_job():
            basic()

        # Ensure that you don't get a migration required exception when running a job
        # pre-migration.
        result = noop_job.execute_in_process(instance=instance)
        assert result.success
        assert len(instance.get_runs()) == 2

        instance.upgrade()

        result = noop_job.execute_in_process(instance=instance)
        assert result.success
        assert len(instance.get_runs()) == 3


def test_0_12_0_extract_asset_index_cols(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_12_0_pre_asset_index_cols/postgres/pg_dump.txt"),
    )

    @op
    def asset_op(_):
        yield AssetMaterialization(asset_key=AssetKey(["a"]), partition="partition_1")
        yield Output(1)

    @job
    def asset_job():
        asset_op()

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            storage = instance._event_storage

            # make sure that executing the job works
            asset_job.execute_in_process(instance=instance)
            assert storage.has_asset_key(AssetKey(["a"]))

            # make sure that wiping works
            storage.wipe_asset(AssetKey(["a"]))
            assert not storage.has_asset_key(AssetKey(["a"]))

            asset_job.execute_in_process(instance=instance)
            assert storage.has_asset_key(AssetKey(["a"]))
            old_keys = storage.all_asset_keys()

            instance.upgrade()
            assert storage.has_asset_key(AssetKey(["a"]))
            new_keys = storage.all_asset_keys()
            assert set(old_keys) == set(new_keys)

            # make sure that storing assets still works
            asset_job.execute_in_process(instance=instance)

            # make sure that wiping still works
            storage.wipe_asset(AssetKey(["a"]))
            assert not storage.has_asset_key(AssetKey(["a"]))


def test_0_12_0_asset_observation_backcompat(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_12_0_pre_asset_index_cols/postgres/pg_dump.txt"),
    )

    @op
    def asset_op(_):
        yield AssetObservation(asset_key=AssetKey(["a"]))
        yield Output(1)

    @job
    def asset_job():
        asset_op()

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            storage = instance._event_storage

            assert not storage.has_secondary_index(ASSET_KEY_INDEX_COLS)

            # make sure that executing the job works
            asset_job.execute_in_process(instance=instance)
            assert storage.has_asset_key(AssetKey(["a"]))


def _reconstruct_from_file(hostname, conn_string, path, username="test", password="test"):
    engine = db.create_engine(conn_string)
    with engine.connect() as conn:
        with conn.begin():
            conn.execute(db.text("drop schema public cascade;"))
            conn.execute(db.text("create schema public;"))
    env = os.environ.copy()
    env["PGPASSWORD"] = password
    subprocess.check_call(
        ["psql", "-h", hostname, "-p", "5432", "-U", username, "-f", path],
        env=env,
    )


def _migration_regex(current_revision, expected_revision=None):
    warning = re.escape(
        "Raised an exception that may indicate that the Dagster database needs to be be migrated."
    )

    if expected_revision:
        revision = re.escape(
            f"Database is at revision {current_revision}, head is {expected_revision}."
        )
    else:
        revision = f"Database is at revision {current_revision}, head is [a-z0-9]+."
    instruction = re.escape("To migrate, run `dagster instance migrate`.")

    return f"{warning} {revision} {instruction}"


def get_the_job():
    @job
    def the_job():
        pass

    return the_job


def test_0_13_12_add_start_time_end_time(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__, "snapshot_0_13_12_pre_start_time_end_time/postgres/pg_dump.txt"
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        # Ensure that you don't get a migration required exception if not trying to use the
        # migration-required column.
        assert len(instance.get_runs()) == 1

        # Ensure that you don't get a migration required exception when running a job
        # pre-migration.
        with execute_job(reconstructable(get_the_job), instance=instance) as result:
            assert result.success
            assert len(instance.get_runs()) == 2

        instance.upgrade()
        instance.reindex()

        with execute_job(reconstructable(get_the_job), instance=instance) as result:
            assert result.success
            assert len(instance.get_runs()) == 3
            latest_run_record = instance.get_run_records()[0]
            assert latest_run_record.end_time > latest_run_record.start_time

            # Verify that historical records also get updated via data migration
            earliest_run_record = instance.get_run_records()[-1]
            assert earliest_run_record.end_time > earliest_run_record.start_time


def test_schedule_secondary_index_table_backcompat(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__, "snapshot_0_14_6_schedule_migration_table/postgres/pg_dump.txt"
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        # secondary indexes should exist because it's colocated in this database from the run
        # storage
        assert instance.schedule_storage.has_secondary_index_table()

        # this should succeed without raising any issues
        instance.upgrade()

        # no-op
        assert instance.schedule_storage.has_secondary_index_table()


def test_instigators_table_backcompat(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(__file__, "snapshot_0_14_6_instigators_table/postgres/pg_dump.txt"),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        instance = DagsterInstance.from_config(tempdir)

        assert not instance.schedule_storage.has_instigators_table()

        instance.upgrade()

        assert instance.schedule_storage.has_instigators_table()


def test_jobs_selector_id_migration(hostname, conn_string):
    from dagster._core.storage.schedules.migration import SCHEDULE_JOBS_SELECTOR_ID
    from dagster._core.storage.schedules.schema import InstigatorsTable, JobTable, JobTickTable

    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__,
            "snapshot_0_14_6_post_schema_pre_data_migration/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            # runs the required data migrations
            instance.upgrade()

            assert instance.schedule_storage.has_built_index(SCHEDULE_JOBS_SELECTOR_ID)
            legacy_count = len(instance.all_instigator_state())
            migrated_instigator_count = instance.schedule_storage.execute(
                db_select([db.func.count()]).select_from(InstigatorsTable)
            )[0][0]
            assert migrated_instigator_count == legacy_count

            migrated_job_count = instance.schedule_storage.execute(
                db_select([db.func.count()])
                .select_from(JobTable)
                .where(JobTable.c.selector_id.isnot(None))
            )[0][0]
            assert migrated_job_count == legacy_count

            legacy_tick_count = instance.schedule_storage.execute(
                db_select([db.func.count()]).select_from(JobTickTable)
            )[0][0]
            assert legacy_tick_count > 0

            # tick migrations are optional
            migrated_tick_count = instance.schedule_storage.execute(
                db_select([db.func.count()])
                .select_from(JobTickTable)
                .where(JobTickTable.c.selector_id.isnot(None))
            )[0][0]
            assert migrated_tick_count == 0

            # run the optional migrations
            instance.reindex()

            migrated_tick_count = instance.schedule_storage.execute(
                db_select([db.func.count()])
                .select_from(JobTickTable)
                .where(JobTickTable.c.selector_id.isnot(None))
            )[0][0]
            assert migrated_tick_count == legacy_tick_count


def test_add_bulk_actions_columns(hostname, conn_string):
    new_columns = {"selector_id", "action_type"}
    new_indexes = {"idx_bulk_actions_action_type", "idx_bulk_actions_selector_id"}

    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            # use an old snapshot, it has the bulk actions table but not the new columns
            __file__,
            "snapshot_0_14_6_post_schema_pre_data_migration/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            assert get_columns(instance, "bulk_actions") & new_columns == set()
            assert get_indexes(instance, "bulk_actions") & new_indexes == set()

            instance.upgrade()
            assert new_columns <= get_columns(instance, "bulk_actions")
            assert new_indexes <= get_indexes(instance, "bulk_actions")


def test_add_kvs_table(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            # use an old snapshot
            __file__,
            "snapshot_0_14_6_post_schema_pre_data_migration/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            assert "kvs" not in get_tables(instance)

            instance.upgrade()
            assert "kvs" in get_tables(instance)
            assert "idx_kvs_keys_unique" in get_indexes(instance, "kvs")


def test_add_asset_event_tags_table(hostname, conn_string):
    @op
    def yields_materialization_w_tags():
        yield AssetMaterialization(asset_key=AssetKey(["a"]))
        yield AssetMaterialization(asset_key=AssetKey(["a"]), tags={DATA_VERSION_TAG: "bar"})
        yield Output(1)

    @job
    def asset_job():
        yields_materialization_w_tags()

    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            # use an old snapshot
            __file__,
            "snapshot_1_0_12_pre_add_asset_event_tags_table/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            assert "asset_event_tags" not in get_tables(instance)

            asset_job.execute_in_process(instance=instance)
            with pytest.raises(
                DagsterInvalidInvocationError, match="In order to search for asset event tags"
            ):
                instance._event_storage.get_event_tags_for_asset(asset_key=AssetKey(["a"]))

            instance.upgrade()
            assert "asset_event_tags" in get_tables(instance)
            asset_job.execute_in_process(instance=instance)
            assert instance._event_storage.get_event_tags_for_asset(asset_key=AssetKey(["a"])) == [
                {DATA_VERSION_TAG: "bar"}
            ]

            indexes = get_indexes(instance, "asset_event_tags")
            assert "idx_asset_event_tags" in indexes
            assert "idx_asset_event_tags_event_id" in indexes


def test_add_cached_status_data_column(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            # use an old snapshot, it has the bulk actions table but not the new columns
            __file__,
            "snapshot_1_0_17_pre_add_cached_status_data_column/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            assert instance.can_read_asset_status_cache() is False
            assert {"cached_status_data"} & get_columns(instance, "asset_keys") == set()

            instance.upgrade()
            assert instance.can_read_asset_status_cache() is True
            assert {"cached_status_data"} <= get_columns(instance, "asset_keys")


def test_add_dynamic_partitions_table(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__,
            "snapshot_1_0_17_pre_add_cached_status_data_column/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            assert "dynamic_partitions" not in get_tables(instance)

            instance.wipe()

            with pytest.raises(DagsterInvalidInvocationError, match="does not exist"):
                instance.get_dynamic_partitions("foo")

            instance.upgrade()
            assert "dynamic_partitions" in get_tables(instance)
            assert instance.get_dynamic_partitions("foo") == []


def _get_table_row_count(run_storage, table, with_non_null_id=False):
    query = db_select([db.func.count()]).select_from(table)
    if with_non_null_id:
        query = query.where(table.c.id.isnot(None))
    with run_storage.connect() as conn:
        row_count = conn.execute(query).fetchone()[0]
    return row_count


def test_add_primary_keys(hostname, conn_string):
    from dagster._core.storage.runs.schema import (
        DaemonHeartbeatsTable,
        InstanceInfo,
        KeyValueStoreTable,
    )

    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__,
            "snapshot_1_1_22_pre_primary_key/postgres/pg_dump.txt",
        ),
    )

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            assert "id" not in get_columns(instance, "kvs")
            # trigger insert, and update
            instance.run_storage.set_cursor_values({"a": "A"})
            instance.run_storage.set_cursor_values({"a": "A"})
            kvs_row_count = _get_table_row_count(instance.run_storage, KeyValueStoreTable)
            assert kvs_row_count > 0

            assert "id" not in get_columns(instance, "instance_info")
            instance_info_row_count = _get_table_row_count(instance.run_storage, InstanceInfo)
            assert instance_info_row_count > 0

            assert "id" not in get_columns(instance, "daemon_heartbeats")
            heartbeat = DaemonHeartbeat(
                timestamp=datetime.datetime.now().timestamp(), daemon_type="test", daemon_id="test"
            )
            instance.run_storage.add_daemon_heartbeat(heartbeat)
            instance.run_storage.add_daemon_heartbeat(heartbeat)
            daemon_heartbeats_row_count = _get_table_row_count(
                instance.run_storage, DaemonHeartbeatsTable
            )
            assert daemon_heartbeats_row_count > 0

            instance.upgrade()

            assert "id" in get_columns(instance, "kvs")
            with instance.run_storage.connect():
                kvs_id_count = _get_table_row_count(
                    instance.run_storage, KeyValueStoreTable, with_non_null_id=True
                )
            assert kvs_id_count == kvs_row_count
            assert get_primary_key(instance, "kvs")

            assert "id" in get_columns(instance, "instance_info")
            with instance.run_storage.connect():
                instance_info_id_count = _get_table_row_count(
                    instance.run_storage, InstanceInfo, with_non_null_id=True
                )
            assert instance_info_id_count == instance_info_row_count
            assert get_primary_key(instance, "instance_info")

            assert "id" in get_columns(instance, "daemon_heartbeats")
            with instance.run_storage.connect():
                daemon_heartbeats_id_count = _get_table_row_count(
                    instance.run_storage, DaemonHeartbeatsTable, with_non_null_id=True
                )
            assert daemon_heartbeats_id_count == daemon_heartbeats_row_count
            assert get_primary_key(instance, "daemon_heartbeats")


def test_bigint_migration(hostname, conn_string):
    _reconstruct_from_file(
        hostname,
        conn_string,
        file_relative_path(
            __file__,
            "snapshot_1_1_22_pre_primary_key/postgres/pg_dump.txt",
        ),
    )

    def _get_integer_id_tables(conn):
        inspector = db.inspect(conn)
        integer_tables = set()
        for table in inspector.get_table_names():
            type_by_col_name = {c["name"]: c["type"] for c in db.inspect(conn).get_columns(table)}
            id_type = type_by_col_name.get("id")
            if id_type and str(id_type) == "INTEGER":
                integer_tables.add(table)
        return integer_tables

    with tempfile.TemporaryDirectory() as tempdir:
        with open(
            file_relative_path(__file__, "dagster.yaml"), "r", encoding="utf8"
        ) as template_fd:
            with open(os.path.join(tempdir, "dagster.yaml"), "w", encoding="utf8") as target_fd:
                template = template_fd.read().format(hostname=hostname)
                target_fd.write(template)

        with DagsterInstance.from_config(tempdir) as instance:
            with instance.run_storage.connect() as conn:
                assert len(_get_integer_id_tables(conn)) > 0
            with instance.event_log_storage.index_connection() as conn:
                assert len(_get_integer_id_tables(conn)) > 0
            with instance.schedule_storage.connect() as conn:
                assert len(_get_integer_id_tables(conn)) > 0

            run_bigint_migration(instance)

            with instance.run_storage.connect() as conn:
                assert len(_get_integer_id_tables(conn)) == 0
            with instance.event_log_storage.index_connection() as conn:
                assert len(_get_integer_id_tables(conn)) == 0
            with instance.schedule_storage.connect() as conn:
                assert len(_get_integer_id_tables(conn)) == 0
