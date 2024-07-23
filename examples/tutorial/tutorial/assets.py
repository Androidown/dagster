from dagster import Definitions, asset, op, define_asset_job, schedule


@asset
def upstream_asset():
    return 1


@op
def add_one(input_num):
    return input_num + 1


@op
def multiply_by_two(input_num):
    return input_num * 2


@asset
def middle_asset(upstream_asset):
    return multiply_by_two(add_one(upstream_asset))


@asset
def downstream_asset(middle_asset):
    return middle_asset + 7


defs = Definitions(
    assets=[downstream_asset, middle_asset, upstream_asset],
)


job_A_sub = define_asset_job("job_A_sub")


@schedule(cron_schedule="*/1 * * * *", job=job_A_sub, execution_timezone="Asia/Shanghai")
def my_schedule(_context):
    return {}
