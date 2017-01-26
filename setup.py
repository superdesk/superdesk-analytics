from setuptools import setup, find_packages
setup(
    name="superdesk-analytics",
    version="0.1",
    package_dir={'': 'server'},
    packages=find_packages('server'),
    author='Sourcefabric',
    author_email='contact@sourcefabric.org',
    license='MIT',
    url='',
)
