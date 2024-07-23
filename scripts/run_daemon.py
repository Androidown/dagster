import pathlib
import sys
import os


if __name__ == '__main__':
    FOLDER = pathlib.Path(__file__).parent.parent / 'examples' / 'tutorial'

    os.environ["DAGSTER_HOME"] = str(FOLDER)
    os.chdir(FOLDER)

    sys.argv.append('run')

    from dagster._daemon.__main__ import main
    main()
