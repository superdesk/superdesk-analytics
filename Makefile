
BACKEND_DIR = server
VENV = `pwd`/${BACKEND_DIR}/env/bin/activate
test:
	flake8 ${BACKEND_DIR}
	cd ${BACKEND_DIR} ; nosetests -v
	cd ${BACKEND_DIR} ; behave --format progress2 --logging-level=ERROR --tags=~@skip
	npm run test
