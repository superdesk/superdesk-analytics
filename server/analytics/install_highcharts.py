import sys
from pathlib import Path
from subprocess import check_call


def install_highcharts_server():
    try:
        script_path = Path(__file__).parent / "scripts" / "install-highcharts-export-server.sh"
        script_path = script_path.resolve()

        if not script_path.exists():
            raise FileNotFoundError(f"Script not found at: {script_path}")

        check_call([str(script_path)])
    except Exception as e:
        sys.stderr.write(f"** Unable to install highchart export server. Report scheduling will not work **:\n{e}\n")
        sys.exit(1)
