from dagster import Definitions, define_asset_job, in_process_executor, load_assets_from_modules

from . import assets

all_assets = load_assets_from_modules([assets])

defs = Definitions(
    assets=all_assets,
    jobs=[
        define_asset_job("job_A_in", executor_def=in_process_executor),
        assets.job_A_sub,
    ],
    # schedules=[assets.my_schedule]
)
