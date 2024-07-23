import pathlib
import sys
import os


if __name__ == '__main__':
    FOLDER = pathlib.Path(__file__).parent.parent / 'examples' / 'tutorial'

    os.environ["DAGSTER_HOME"] = str(FOLDER)
    os.chdir(FOLDER)

    sys.argv.extend(f"""\
    api grpc 
    --lazy-load-user-code 
    --port 8999 
    --log-level debug 
    --location-name tutorial 
    -m tutorial""".split()
    )

    from dagster._cli import main


    main()
