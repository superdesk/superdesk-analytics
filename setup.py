from setuptools import setup, find_packages
from setuptools.command.develop import develop
from setuptools.command.install import install
from subprocess import check_call
from os import path
from distutils import log


def install_highcharts():
    try:
        check_call("./install-highcharts-export-server.sh", cwd=path.realpath("server/analytics/scripts"))
    except Exception as e:
        log.error(f"\t**NodeJs not found, report scheduling will not work**:\n\t{e}")


class PostDevelopCommand(develop):
    """Post-installation for development mode."""

    def run(self):
        self.execute(install_highcharts, ())
        develop.run(self)


class PostInstallCommand(install):
    """Post-installation for installation mode."""

    def run(self):
        self.execute(install_highcharts, ())
        install.run(self)


package_data = {
    "analytics": ["scripts/*.sh"],
}


setup(
    name="superdesk-analytics",
    version="3.2.0-dev.0",
    package_dir={"": "server"},
    packages=find_packages("server"),
    package_data=package_data,
    include_package_data=True,
    author="Sourcefabric",
    author_email="contact@sourcefabric.org",
    license="MIT",
    url="https://github.com/superdesk/superdesk-analytics",
    cmdclass={
        "develop": PostDevelopCommand,
        "install": PostInstallCommand,
    },
    entry_points={
        "console_scripts": [
            "install-highcharts-server=analytics.install_highcharts:install_highcharts_server",
        ],
    },
)
