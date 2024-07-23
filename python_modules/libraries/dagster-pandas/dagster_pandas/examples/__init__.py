from dagster import (
    FilesystemIOManager,
    config_from_files,
    file_relative_path,
    graph,
    in_process_executor,
    repository,
)

from .pandas_hello_world.ops import always_fails_op, papermill_pandas_hello_world, sum_op, sum_sq_op


@graph
def pandas_hello_world_fails():
    always_fails_op(sum_sq_op=sum_sq_op(sum_df=sum_op()))


pandas_hello_world_fails_test = pandas_hello_world_fails.to_job(executor_def=in_process_executor)


@graph
def pandas_hello_world():
    sum_sq_op(sum_op())


pandas_hello_world_test = pandas_hello_world.to_job(
    config=config_from_files(
        [
            file_relative_path(
                __file__, "pandas_hello_world/environments/pandas_hello_world_test.yaml"
            )
        ]
    ),
    executor_def=in_process_executor,
)

pandas_hello_world_prod = pandas_hello_world.to_job(
    config=config_from_files(
        [
            file_relative_path(
                __file__, "pandas_hello_world/environments/pandas_hello_world_prod.yaml"
            )
        ]
    )
)


@graph
def papermill_pandas_hello_world_graph():
    papermill_pandas_hello_world()


papermill_pandas_hello_world_test = papermill_pandas_hello_world_graph.to_job(
    resource_defs={"io_manager": FilesystemIOManager()},
    config=config_from_files(
        [
            file_relative_path(
                __file__,
                "pandas_hello_world/environments/papermill_pandas_hello_world_test.yaml",
            )
        ]
    ),
)

papermill_pandas_hello_world_prod = papermill_pandas_hello_world_graph.to_job(
    resource_defs={"io_manager": FilesystemIOManager()},
    config=config_from_files(
        [
            file_relative_path(
                __file__,
                "pandas_hello_world/environments/papermill_pandas_hello_world_prod.yaml",
            )
        ]
    ),
)


@repository
def dagstermill_pandas_test_repo():
    return [papermill_pandas_hello_world_test, pandas_hello_world_test]


@repository
def dagstermill_pandas_prod_repo():
    return [papermill_pandas_hello_world_prod, pandas_hello_world_prod]
