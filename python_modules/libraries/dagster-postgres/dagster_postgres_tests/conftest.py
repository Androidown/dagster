import pytest
from dagster._utils import file_relative_path
from dagster._utils.test.postgres_instance import TestPostgresInstance


@pytest.fixture(scope="session")
def hostname(conn_string):
    return TestPostgresInstance.get_hostname()


@pytest.fixture(scope="session")
def conn_string():
    with TestPostgresInstance.docker_service_up_or_skip(
        file_relative_path(__file__, "docker-compose.yml"), "test-postgres-db"
    ) as conn_str:
        yield conn_str
