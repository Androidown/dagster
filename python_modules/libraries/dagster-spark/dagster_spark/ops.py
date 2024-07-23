from dagster import (
    In,
    Nothing,
    Out,
    _check as check,
    op,
)
from dagster._core.storage.tags import COMPUTE_KIND_TAG

from .configs import define_spark_config


def create_spark_op(
    name, main_class, description=None, required_resource_keys=frozenset(["spark"])
):
    check.str_param(name, "name")
    check.str_param(main_class, "main_class")
    check.opt_str_param(description, "description", "A parameterized Spark job.")
    check.set_param(required_resource_keys, "required_resource_keys")

    @op(
        name=name,
        description=description,
        config_schema=define_spark_config(),
        ins={"start": In(Nothing)},
        out=Out(Nothing),
        tags={COMPUTE_KIND_TAG: "spark", "main_class": main_class},
        required_resource_keys=required_resource_keys,
    )
    def spark_op(context):
        context.resources.spark.run_spark_job(context.op_config, main_class)

    return spark_op
