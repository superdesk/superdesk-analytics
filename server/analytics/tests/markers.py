from pytest import mark

# Skips the test, due to commands not being async
requires_async_commands = mark.skip(reason="Requires commands to be async")

# highcharts server generation is not working on Github Actions
# need to figure out why and then enable the tests
fix_highchart_server = mark.skip(reason="Highcharts server fails")
