import pathlib
import sys
import os

if __name__ == '__main__':

    FOLDER = pathlib.Path(__file__).parent.parent / 'examples' / 'tutorial'

    os.environ["DAGSTER_HOME"] = str(FOLDER)
    os.chdir(FOLDER)

    sys.argv.extend('-p 8000 --grpc-port=8999'.split())

    from dagster_webserver.__main__ import main


    main()
