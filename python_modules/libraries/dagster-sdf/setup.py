from pathlib import Path
from typing import Dict, Tuple

from setuptools import find_packages, setup


def get_version() -> Tuple[str, str]:
    version: Dict[str, str] = {}
    sdf_version: Dict[str, str] = {}
    with open(Path(__file__).parent / "dagster_sdf/version.py", encoding="utf8") as fp:
        exec(fp.read(), version)

    with open(Path(__file__).parent / "dagster_sdf/sdf_version.py", encoding="utf8") as fp:
        exec(fp.read(), sdf_version)

    return version["__version__"], sdf_version["SDF_VERSION_UPPER_BOUND"]


dagster_sdf_version, SDF_VERSION_UPPER_BOUND = get_version()
# dont pin dev installs to avoid pip dep resolver issues
pin = "" if dagster_sdf_version == "1!0+dev" else f"=={dagster_sdf_version}"
setup(
    name="dagster-sdf",
    version=dagster_sdf_version,
    author="SDF Labs",
    author_email="hello@sdf.com",
    license="Apache-2.0",
    description="A Dagster integration for sdf",
    url="https://github.com/dagster-io/dagster/tree/master/python_modules/libraries/dagster-sdf",
    classifiers=[
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
    ],
    packages=find_packages(exclude=["dagster_sdf_tests*"]),
    python_requires=">=3.8,<3.13",
    install_requires=[
        f"dagster{pin}",
        f"sdf-cli>=0.3.9,<{SDF_VERSION_UPPER_BOUND}",
        "orjson",
        "polars",
    ],
    zip_safe=False,
    extras_require={"test": []},
)
