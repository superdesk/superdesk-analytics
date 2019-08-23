from setuptools import setup, find_packages
from setuptools.command.develop import develop
from setuptools.command.install import install
from subprocess import check_call, CalledProcessError
from distutils import log
import os


def install_highcharts():
    try:
        print('cwd', os.getcwd())
        check_call(
            os.path.join(
                os.path.realpath(os.path.dirname(__file__)),
                'server',
                'scripts',
                'install-highcharts-export-server.sh',
            ),
        )
    except CalledProcessError as e:
        log.error('\t**NodeJs not found, report scheduling will not work**:\n\t{}'.format(e))


class PostDevelopCommand(develop):
    """Post-installation for development mode."""
    def run(self):
        print('cwd', os.getcwd())
        self.execute(install_highcharts, ())
        develop.run(self)


class PostInstallCommand(install):
    """Post-installation for installation mode."""
    def run(self):
        self.execute(install_highcharts, ())
        install.run(self)


setup(
    name="superdesk-analytics",
    version="0.1",
    package_dir={'': 'server'},
    packages=find_packages('server'),
    author='Sourcefabric',
    author_email='contact@sourcefabric.org',
    license='MIT',
    url='https://github.com/superdesk/superdesk-analytics',
    cmdclass={
        'develop': PostDevelopCommand,
        'install': PostInstallCommand
    }
)
