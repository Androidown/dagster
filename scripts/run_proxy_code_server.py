import pathlib
import sys
import os

if __name__ == '__main__':
    MODULE = "tutorial"

    FOLDER = pathlib.Path(__file__).parent.parent / 'examples' / MODULE

    os.environ["DAGSTER_HOME"] = str(FOLDER)
    os.chdir(FOLDER)

    sys.argv.extend(f'code-server start -p 8999 -m {MODULE} --location-name {MODULE}'.split())

    from dagster._cli import main

    main()
