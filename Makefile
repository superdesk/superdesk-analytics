
BACKEND_DIR = server
VENV = `pwd`/${BACKEND_DIR}/env/bin/activate
test:
	flake8 ${BACKEND_DIR}
	cd ${BACKEND_DIR} ; nosetests -v --with-coverage --cover-package=analytics
	mv  ${BACKEND_DIR}/.coverage .coverage.nosetests
	cd ${BACKEND_DIR} ; coverage run --source analytics --omit "*tests*" -m behave --format progress2 --logging-level=ERROR --tags=~@skip
	mv  ${BACKEND_DIR}/.coverage .coverage.behave
	coverage combine .coverage.behave .coverage.nosetests
	npm run test
