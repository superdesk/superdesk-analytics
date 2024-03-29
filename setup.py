from setuptools import setup, find_packages
from setuptools.command.develop import develop
from setuptools.command.install import install
from subprocess import check_call
from os import path
from distutils import log


def install_highcharts():
    try:
        check_call(
            "./install-highcharts-export-server.sh",
            cwd=path.realpath('server/scripts')
        )
    except Exception as e:
        log.error('\t**NodeJs not found, report scheduling will not work**:\n\t{}'.format(e))


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
    "scripts": ["*.sh"],
}


setup(
    name="superdesk-analytics",
    version="2.7.0-dev",
    package_dir={'': 'server'},
    packages=find_packages('server'),
    package_data=package_data,
    include_package_data=True,
    author='Sourcefabric',
    author_email='contact@sourcefabric.org',
    license='MIT',
    url='https://github.com/superdesk/superdesk-analytics',
    cmdclass={
        'develop': PostDevelopCommand,
        'install': PostInstallCommand
    }
)
