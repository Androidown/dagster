import pytest
from dagster import build_op_context, op
from dagster_gcp.gcs.resources import GCSResource, gcs_resource

PROJECT_ID = "test-project1231"


@pytest.mark.integration
def test_gcs_resource():
    @op(required_resource_keys={"gcs"})
    def gcs_op(context):
        assert context.resources.gcs
        assert context.resources.gcs.project == PROJECT_ID
        return 1

    context = build_op_context(resources={"gcs": gcs_resource.configured({"project": PROJECT_ID})})

    assert gcs_op(context)


@pytest.mark.integration
def test_pydantic_gcs_resource():
    @op
    def gcs_op(gcs: GCSResource):
        assert gcs
        assert gcs.project == PROJECT_ID
        return 1

    gcs = GCSResource(project=PROJECT_ID)

    assert gcs_op(gcs)
